import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Register } from './entities/register.entity';
import { RegisterSession } from './entities/register-session.entity';
import { RegisterSessionPaymentSummary } from './entities/register-session-payment-summary.entity';
import { CashMovement } from './entities/cash-movement.entity';
import { RegisterSessionStatus, CashMovementType } from './register-enums';
import { CreateRegisterDto } from './dto/create-register.dto';
import { UpdateRegisterDto } from './dto/update-register.dto';
import { OpenRegisterDto } from './dto/open-register.dto';
import { CloseRegisterDto } from './dto/close-register.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { Location } from '../locations/location.entity';
import { User } from '../users/user.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { PaymentMethodType } from '../payment-methods/payment-method-type.enum';
import { Sale } from '../sales/entities/sale.entity';
import { SaleStatus } from '../sales/sale-enums';
import { toCsv } from '../../common/utils/csv.util';
import type { RequestUser } from '../../common/types/authenticated-request';

const BALANCE_EPSILON = 0.01;
const MAX_EXPORT_ROWS = 5000;

@Injectable()
export class RegistersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Register)
    private readonly registerRepository: Repository<Register>,
    @InjectRepository(RegisterSession)
    private readonly sessionRepository: Repository<RegisterSession>,
    @InjectRepository(RegisterSessionPaymentSummary)
    private readonly summaryRepository: Repository<RegisterSessionPaymentSummary>,
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  // ------------------------------------------------------------------ list

  /** Grouped by location — the Registers page's "All Locations" / per-location
   * tabs, each showing its registers as cards. */
  async findAllGroupedByLocation() {
    const [locations, registers] = await Promise.all([
      this.locationRepository.find({
        where: { isActive: true },
        order: { isDefault: 'DESC', name: 'ASC' },
      }),
      this.registerRepository.find({
        relations: { cashiers: true, paymentMethods: true },
        order: { createdAt: 'ASC' },
      }),
    ]);
    const openSessions = await this.sessionRepository.find({
      where: {
        registerId: In(registers.map((register) => register.id)),
        status: RegisterSessionStatus.OPEN,
      },
      relations: { openedBy: true },
    });
    const openSessionByRegister = new Map(
      openSessions.map((session) => [session.registerId, session]),
    );

    return locations.map((location) => ({
      locationId: location.id,
      locationName: location.name,
      registers: registers
        .filter((register) => register.locationId === location.id)
        .map((register) =>
          this.toSummary(
            register,
            openSessionByRegister.get(register.id) ?? null,
          ),
        ),
    }));
  }

  private toSummary(register: Register, openSession: RegisterSession | null) {
    return {
      id: register.id,
      name: register.name,
      locationId: register.locationId,
      printerType: register.printerType,
      sellLayout: register.sellLayout,
      cashiers: register.cashiers.map((user) => ({
        id: user.id,
        nameEn: user.nameEn,
        nameAr: user.nameAr,
      })),
      paymentMethods: register.paymentMethods.map((method) => ({
        id: method.id,
        name: method.name,
        type: method.type,
      })),
      openSession: openSession
        ? {
            id: openSession.id,
            openedAt: openSession.openedAt,
            openedByUserId: openSession.openedByUserId,
            openedByName: openSession.openedBy?.nameEn ?? '',
          }
        : null,
    };
  }

  // ------------------------------------------------------------------ crud

  async findOne(id: string) {
    const register = await this.loadRegister(id);
    const openSession = await this.sessionRepository.findOne({
      where: { registerId: id, status: RegisterSessionStatus.OPEN },
      relations: { openedBy: true },
    });
    return this.toSummary(register, openSession);
  }

  async create(dto: CreateRegisterDto): Promise<Register> {
    await this.assertLocationExists(dto.locationId);
    const [cashiers, paymentMethods] = await this.resolveCashiersAndMethods(
      dto.cashierIds,
      dto.paymentMethodIds,
    );

    const register = this.registerRepository.create({
      name: dto.name.trim(),
      locationId: dto.locationId,
      printerType: dto.printerType,
      cashiers,
      paymentMethods,
    });
    return this.registerRepository.save(register);
  }

  async update(id: string, dto: UpdateRegisterDto): Promise<Register> {
    const register = await this.loadRegister(id);

    if (dto.name !== undefined) register.name = dto.name.trim();
    if (dto.printerType !== undefined) register.printerType = dto.printerType;
    if (dto.cashierIds !== undefined || dto.paymentMethodIds !== undefined) {
      const [cashiers, paymentMethods] = await this.resolveCashiersAndMethods(
        dto.cashierIds ?? register.cashiers.map((user) => user.id),
        dto.paymentMethodIds ??
          register.paymentMethods.map((method) => method.id),
      );
      if (dto.cashierIds !== undefined) register.cashiers = cashiers;
      if (dto.paymentMethodIds !== undefined)
        register.paymentMethods = paymentMethods;
    }

    return this.registerRepository.save(register);
  }

  // -------------------------------------------------------------- sessions

  async open(id: string, dto: OpenRegisterDto, user: RequestUser) {
    const register = await this.loadRegister(id);
    this.assertIsCashier(register, user);

    const alreadyOpen = await this.sessionRepository.exists({
      where: { registerId: id, status: RegisterSessionStatus.OPEN },
    });
    if (alreadyOpen) {
      throw new BadRequestException(this.t('registers.already_open'));
    }

    const session = this.sessionRepository.create({
      registerId: id,
      status: RegisterSessionStatus.OPEN,
      openedByUserId: user.id,
      openingAmount: dto.openingAmount,
      openingDenominations: dto.denominations,
    });
    return this.sessionRepository.save(session);
  }

  /**
   * Reconciles every payment method assigned to the register, not just cash:
   * the cash-type method's expected amount is opening float + cash movements
   * + that method's completed sales; every other method is just its
   * completed sales (no float, no movements). The session's own
   * closingAmount/expectedAmount/difference are the sums across all methods
   * (the "Total" row in Cash Management) — the per-method breakdown lives in
   * RegisterSessionPaymentSummary.
   */
  async close(id: string, dto: CloseRegisterDto, user: RequestUser) {
    const register = await this.loadRegister(id);
    this.assertIsCashier(register, user);
    const session = await this.getOpenSessionOrFail(id);

    const assignedIds = register.paymentMethods.map((method) => method.id);
    const countedIds = dto.counts.map((count) => count.paymentMethodId);
    if (new Set(countedIds).size !== countedIds.length) {
      throw new BadRequestException(
        this.t('registers.duplicate_payment_method_count'),
      );
    }
    if (
      assignedIds.length !== countedIds.length ||
      !assignedIds.every((methodId) => countedIds.includes(methodId))
    ) {
      throw new BadRequestException(
        this.t('registers.count_every_payment_method'),
      );
    }

    const [movements, salesTotals] = await Promise.all([
      this.cashMovementRepository.find({
        where: { registerSessionId: session.id },
      }),
      this.saleRepository
        .createQueryBuilder('sale')
        .select('sale.paymentMethodId', 'paymentMethodId')
        .addSelect('SUM(sale.amountPaid)', 'total')
        .where('sale.registerSessionId = :sessionId', { sessionId: session.id })
        .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
        .groupBy('sale.paymentMethodId')
        .getRawMany<{ paymentMethodId: string; total: string }>(),
    ]);
    const netMovements = movements.reduce(
      (sum, movement) =>
        sum +
        (movement.type === CashMovementType.IN
          ? movement.amount
          : -movement.amount),
      0,
    );
    const salesByMethod = new Map(
      salesTotals.map((row) => [row.paymentMethodId, Number(row.total)]),
    );
    const round = (value: number) => Math.round(value * 100) / 100;

    const summaries = dto.counts.map((count) => {
      const method = register.paymentMethods.find(
        (candidate) => candidate.id === count.paymentMethodId,
      )!;
      const salesTotal = salesByMethod.get(count.paymentMethodId) ?? 0;
      const expectedAmount = round(
        method.type === PaymentMethodType.CASH
          ? session.openingAmount + netMovements + salesTotal
          : salesTotal,
      );
      return this.summaryRepository.create({
        registerSessionId: session.id,
        paymentMethodId: count.paymentMethodId,
        expectedAmount,
        countedAmount: count.countedAmount,
        difference: round(count.countedAmount - expectedAmount),
        denominations:
          method.type === PaymentMethodType.CASH ? count.denominations : null,
      });
    });

    const totalExpected = round(
      summaries.reduce((sum, summary) => sum + summary.expectedAmount, 0),
    );
    const totalCounted = round(
      summaries.reduce((sum, summary) => sum + summary.countedAmount, 0),
    );
    const cashSummary = summaries.find(
      (summary) =>
        register.paymentMethods.find(
          (method) => method.id === summary.paymentMethodId,
        )?.type === PaymentMethodType.CASH,
    );

    session.status = RegisterSessionStatus.CLOSED;
    session.closedByUserId = user.id;
    session.closedAt = new Date();
    session.closingAmount = totalCounted;
    session.closingDenominations = cashSummary?.denominations ?? null;
    session.expectedAmount = totalExpected;
    session.difference = round(totalCounted - totalExpected);

    return this.dataSource.transaction(async (manager) => {
      const savedSession = await manager.save(session);
      await manager.save(summaries);
      return savedSession;
    });
  }

  // ---------------------------------------------------------- cash management

  /** Cash Management's list — every session (open or closed), across every
   * register/location, with a derived status. */
  private buildSessionsQuery(query: QuerySessionsDto) {
    const qb = this.sessionRepository
      .createQueryBuilder('session')
      .innerJoinAndSelect('session.register', 'register')
      .innerJoinAndSelect('register.location', 'location')
      .leftJoinAndSelect('session.openedBy', 'openedBy')
      .leftJoinAndSelect('session.closedBy', 'closedBy');

    if (query.locationId)
      qb.andWhere('register.locationId = :locationId', {
        locationId: query.locationId,
      });
    if (query.registerId)
      qb.andWhere('session.registerId = :registerId', {
        registerId: query.registerId,
      });
    // BALANCED/UNBALANCED aren't stored columns — filtered here in SQL (not
    // after paginating in JS, which would desync `total`/page contents from
    // what's actually returned).
    if (query.status === 'OPEN') {
      qb.andWhere('session.status = :status', {
        status: RegisterSessionStatus.OPEN,
      });
    } else if (query.status === 'BALANCED') {
      qb.andWhere('session.status = :status', {
        status: RegisterSessionStatus.CLOSED,
      });
      qb.andWhere('ABS(session.difference) < :epsilon', {
        epsilon: BALANCE_EPSILON,
      });
    } else if (query.status === 'UNBALANCED') {
      qb.andWhere('session.status = :status', {
        status: RegisterSessionStatus.CLOSED,
      });
      qb.andWhere('ABS(session.difference) >= :epsilon', {
        epsilon: BALANCE_EPSILON,
      });
    }
    return qb.orderBy('session.openedAt', 'DESC');
  }

  private toSessionListItem(session: RegisterSession) {
    return {
      id: session.id,
      registerId: session.registerId,
      registerName: session.register!.name,
      locationId: session.register!.locationId,
      locationName: session.register!.location!.name,
      openedByName: session.openedBy?.nameEn ?? '',
      closedByName: session.closedBy?.nameEn ?? null,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      status: this.sessionStatus(session),
    };
  }

  async listSessions(query: QuerySessionsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const [sessions, total] = await this.buildSessionsQuery(query)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: sessions.map((session) => this.toSessionListItem(session)),
      total,
      page,
      pageSize,
    };
  }

  async exportSessionsCsv(query: QuerySessionsDto): Promise<string> {
    const sessions = await this.buildSessionsQuery(query)
      .take(MAX_EXPORT_ROWS)
      .getMany();

    const header = [
      'Location',
      'Register',
      'Opened By',
      'Open Date',
      'Closed By',
      'Close Date',
      'Status',
    ];
    const rows = sessions.map((session) => {
      const item = this.toSessionListItem(session);
      return [
        item.locationName,
        item.registerName,
        item.openedByName,
        item.openedAt.toISOString(),
        item.closedByName ?? '',
        item.closedAt ? item.closedAt.toISOString() : '',
        item.status,
      ];
    });
    return '﻿' + toCsv([header, ...rows]);
  }

  async getSessionDetail(id: string) {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: {
        register: { location: true },
        openedBy: true,
        closedBy: true,
      },
    });
    if (!session) {
      throw new NotFoundException(this.t('registers.session_not_found'));
    }
    const summaries = await this.summaryRepository.find({
      where: { registerSessionId: id },
      relations: { paymentMethod: true },
    });

    return {
      id: session.id,
      registerId: session.registerId,
      registerName: session.register!.name,
      locationId: session.register!.locationId,
      locationName: session.register!.location!.name,
      openedByName: session.openedBy?.nameEn ?? '',
      closedByName: session.closedBy?.nameEn ?? null,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      status: this.sessionStatus(session),
      openingAmount: session.openingAmount,
      openingDenominations: session.openingDenominations,
      totalExpected: session.expectedAmount,
      totalCounted: session.closingAmount,
      totalDifference: session.difference,
      paymentSummaries: summaries.map((summary) => ({
        paymentMethodId: summary.paymentMethodId,
        paymentMethodName: summary.paymentMethod?.name ?? '',
        expectedAmount: summary.expectedAmount,
        countedAmount: summary.countedAmount,
        difference: summary.difference,
        denominations: summary.denominations,
      })),
    };
  }

  private sessionStatus(
    session: RegisterSession,
  ): 'OPEN' | 'BALANCED' | 'UNBALANCED' {
    if (session.status === RegisterSessionStatus.OPEN) return 'OPEN';
    return Math.abs(session.difference ?? 0) < BALANCE_EPSILON
      ? 'BALANCED'
      : 'UNBALANCED';
  }

  /** Cash Management's "Add/Withdraw" tab — unlike `listCashMovements`, this
   * works for a closed session too (it's just history at that point). */
  async listMovementsForSession(sessionId: string): Promise<CashMovement[]> {
    if (!(await this.sessionRepository.exists({ where: { id: sessionId } }))) {
      throw new NotFoundException(this.t('registers.session_not_found'));
    }
    return this.cashMovementRepository.find({
      where: { registerSessionId: sessionId },
      relations: { createdBy: true },
      order: { createdAt: 'DESC' },
    });
  }

  async addCashMovement(
    id: string,
    dto: CreateCashMovementDto,
    user: RequestUser,
  ): Promise<CashMovement> {
    const session = await this.getOpenSessionOrFail(id);
    const movement = this.cashMovementRepository.create({
      registerSessionId: session.id,
      type: dto.type,
      amount: dto.amount,
      reason: dto.reason?.trim() || null,
      createdByUserId: user.id,
    });
    return this.cashMovementRepository.save(movement);
  }

  async listCashMovements(id: string): Promise<CashMovement[]> {
    const session = await this.getOpenSessionOrFail(id);
    return this.cashMovementRepository.find({
      where: { registerSessionId: session.id },
      relations: { createdBy: true },
      order: { createdAt: 'DESC' },
    });
  }

  // --------------------------------------------------------------- helpers

  private async loadRegister(id: string): Promise<Register> {
    const register = await this.registerRepository.findOne({
      where: { id },
      relations: { cashiers: true, paymentMethods: true },
    });
    if (!register) {
      throw new NotFoundException(this.t('registers.not_found'));
    }
    return register;
  }

  private async getOpenSessionOrFail(
    registerId: string,
  ): Promise<RegisterSession> {
    const session = await this.sessionRepository.findOne({
      where: { registerId, status: RegisterSessionStatus.OPEN },
    });
    if (!session) {
      throw new BadRequestException(this.t('registers.not_open'));
    }
    return session;
  }

  /** Only a register's assigned cashiers may open/close it or move its cash —
   * matches the reference UI, which only ever shows these actions to "You"
   * when you're listed under Assigned Cashiers. */
  private assertIsCashier(register: Register, user: RequestUser): void {
    if (!register.cashiers.some((cashier) => cashier.id === user.id)) {
      throw new ForbiddenException(this.t('registers.not_a_cashier'));
    }
  }

  private async assertLocationExists(locationId: string): Promise<void> {
    if (
      !(await this.locationRepository.exists({ where: { id: locationId } }))
    ) {
      throw new BadRequestException(this.t('registers.location_not_found'));
    }
  }

  private async resolveCashiersAndMethods(
    cashierIds: string[],
    paymentMethodIds: string[],
  ): Promise<[User[], PaymentMethod[]]> {
    const [cashiers, paymentMethods] = await Promise.all([
      this.userRepository.find({ where: { id: In(cashierIds) } }),
      this.paymentMethodRepository.find({
        where: { id: In(paymentMethodIds) },
      }),
    ]);
    if (cashiers.length !== new Set(cashierIds).size) {
      throw new BadRequestException(this.t('registers.cashier_not_found'));
    }
    if (paymentMethods.length !== new Set(paymentMethodIds).size) {
      throw new BadRequestException(
        this.t('registers.payment_method_not_found'),
      );
    }
    return [cashiers, paymentMethods];
  }
}
