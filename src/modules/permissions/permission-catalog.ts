import { PermissionModule } from './permission-module.enum';

export interface PermissionCatalogEntry {
  module: PermissionModule;
  code: string;
  descriptionEn: string;
  descriptionAr: string;
}

/**
 * Single source of truth for every permission the system knows about.
 * Consumed by the seed script (src/database/seed.ts) and by GET /permissions.
 *
 * As of this catalog, every module lists its full intended permission set
 * (matching the target product design), not just modules with real feature
 * endpoints today. A permission existing here does NOT mean it's enforced
 * anywhere yet — `@RequirePermissions()` only guards the routes that actually
 * exist (currently: auth, users, roles, permissions, locations). Permissions
 * for modules without a built feature (Customers, Products, Stock, ...) sit
 * inert, exactly like today's `<module>.access` toggles always have, until
 * that module's real endpoints are built and start checking them.
 */
export const PERMISSION_CATALOG: PermissionCatalogEntry[] = [
  // POS
  {
    module: PermissionModule.POS,
    code: 'pos.access',
    descriptionEn: 'Access the point of sale',
    descriptionAr: 'الوصول إلى نقطة البيع',
  },
  {
    module: PermissionModule.POS,
    code: 'pos.manage_cash',
    descriptionEn: 'Add and withdraw cash',
    descriptionAr: 'إضافة وسحب النقد',
  },
  {
    module: PermissionModule.POS,
    code: 'pos.park_sale',
    descriptionEn: 'Park sales',
    descriptionAr: 'تعليق عمليات البيع',
  },
  {
    module: PermissionModule.POS,
    code: 'pos.remove_cart_items',
    descriptionEn: 'Remove cart items',
    descriptionAr: 'إزالة عناصر السلة',
  },
  {
    module: PermissionModule.POS,
    code: 'pos.edit_prices_discounts',
    descriptionEn: 'Edit prices and add discounts',
    descriptionAr: 'تعديل الأسعار وإضافة الخصومات',
  },
  {
    module: PermissionModule.POS,
    code: 'pos.sell_wholesale',
    descriptionEn: 'Sell at wholesale price',
    descriptionAr: 'البيع بسعر الجملة',
  },
  {
    module: PermissionModule.POS,
    code: 'pos.checkout_post_payment',
    descriptionEn: 'Checkout using post payment method',
    descriptionAr: 'الدفع باستخدام طريقة الدفع الآجل',
  },
  {
    module: PermissionModule.POS,
    code: 'pos.manage_digital_menu',
    descriptionEn: 'User can view and manage the digital menu',
    descriptionAr: 'يمكن للمستخدم عرض وإدارة القائمة الرقمية',
  },
  {
    module: PermissionModule.POS,
    code: 'pos.view_sale_invoices',
    descriptionEn: 'User can view sale invoices',
    descriptionAr: 'يمكن للمستخدم عرض فواتير المبيعات',
  },
  {
    module: PermissionModule.POS,
    code: 'pos.manage_promotions',
    descriptionEn: 'User can create and manage promotions',
    descriptionAr: 'يمكن للمستخدم إنشاء وإدارة العروض الترويجية',
  },
  {
    module: PermissionModule.POS,
    code: 'pos.manage_sale_settings',
    descriptionEn: 'User can view and manage point of sale settings',
    descriptionAr: 'يمكن للمستخدم عرض وإدارة إعدادات نقطة البيع',
  },

  // Customers
  {
    module: PermissionModule.CUSTOMERS,
    code: 'customers.access',
    descriptionEn:
      'Allow user to view basic customer information (name and mobile number)',
    descriptionAr:
      'السماح للمستخدم بعرض معلومات العميل الأساسية (الاسم ورقم الجوال)',
  },
  {
    module: PermissionModule.CUSTOMERS,
    code: 'customers.create',
    descriptionEn: 'User can add new customers',
    descriptionAr: 'يمكن للمستخدم إضافة عملاء جدد',
  },
  {
    module: PermissionModule.CUSTOMERS,
    code: 'customers.edit',
    descriptionEn: 'User can edit existing customers',
    descriptionAr: 'يمكن للمستخدم تعديل بيانات العملاء الحاليين',
  },
  {
    module: PermissionModule.CUSTOMERS,
    code: 'customers.delete',
    descriptionEn: 'User can delete existing customers',
    descriptionAr: 'يمكن للمستخدم حذف العملاء الحاليين',
  },
  {
    module: PermissionModule.CUSTOMERS,
    code: 'customers.export',
    descriptionEn: 'User can export all customer data in CSV and Excel formats',
    descriptionAr: 'يمكن للمستخدم تصدير جميع بيانات العملاء بصيغتي CSV وExcel',
  },
  {
    module: PermissionModule.CUSTOMERS,
    code: 'customers.view_balances',
    descriptionEn:
      'User can view transactions, total paid and due amounts of all customers',
    descriptionAr:
      'يمكن للمستخدم عرض المعاملات وإجمالي المبالغ المدفوعة والمستحقة لجميع العملاء',
  },
  {
    module: PermissionModule.CUSTOMERS,
    code: 'customers.manage_settlements',
    descriptionEn:
      'User can create settlements, and mark invoices as fully or partially paid',
    descriptionAr:
      'يمكن للمستخدم إنشاء التسويات، وتحديد الفواتير كمدفوعة بالكامل أو جزئيًا',
  },

  // eCommerce Orders
  {
    module: PermissionModule.ECOMMERCE_ORDERS,
    code: 'ecommerce_orders.access',
    descriptionEn: 'Allow user to view online store orders',
    descriptionAr: 'السماح للمستخدم بعرض طلبات المتجر الإلكتروني',
  },
  {
    module: PermissionModule.ECOMMERCE_ORDERS,
    code: 'ecommerce_orders.manage',
    descriptionEn:
      'User can process orders, change order status, and manage refunds',
    descriptionAr:
      'يمكن للمستخدم معالجة الطلبات وتغيير حالتها وإدارة المبالغ المستردة',
  },

  // Products
  {
    module: PermissionModule.PRODUCTS,
    code: 'products.access',
    descriptionEn:
      'Allow user to view basic product information. This does not include cost and quantities',
    descriptionAr:
      'السماح للمستخدم بعرض معلومات المنتج الأساسية، ولا يشمل ذلك التكلفة والكميات',
  },
  {
    module: PermissionModule.PRODUCTS,
    code: 'products.create',
    descriptionEn: 'User can add new products',
    descriptionAr: 'يمكن للمستخدم إضافة منتجات جديدة',
  },
  {
    module: PermissionModule.PRODUCTS,
    code: 'products.edit',
    descriptionEn: 'User can edit existing products',
    descriptionAr: 'يمكن للمستخدم تعديل المنتجات الحالية',
  },
  {
    module: PermissionModule.PRODUCTS,
    code: 'products.delete',
    descriptionEn: 'User can delete existing products',
    descriptionAr: 'يمكن للمستخدم حذف المنتجات الحالية',
  },
  {
    module: PermissionModule.PRODUCTS,
    code: 'products.view_cost',
    descriptionEn: 'User can view weighted average cost, and last buy price',
    descriptionAr: 'يمكن للمستخدم عرض متوسط التكلفة المرجح وآخر سعر شراء',
  },
  {
    module: PermissionModule.PRODUCTS,
    code: 'products.export',
    descriptionEn: 'User can export product information in CSV format',
    descriptionAr: 'يمكن للمستخدم تصدير معلومات المنتجات بصيغة CSV',
  },
  {
    module: PermissionModule.PRODUCTS,
    code: 'products.print_barcode',
    descriptionEn: 'User can print barcode labels for products',
    descriptionAr: 'يمكن للمستخدم طباعة ملصقات الباركود للمنتجات',
  },
  {
    module: PermissionModule.PRODUCTS,
    code: 'products.manage_categories',
    descriptionEn: 'User can create, edit, and delete product categories',
    descriptionAr: 'يمكن للمستخدم إنشاء وتعديل وحذف فئات المنتجات',
  },
  {
    module: PermissionModule.PRODUCTS,
    code: 'products.manage_modifiers',
    descriptionEn: 'User can create, edit, and delete product modifiers',
    descriptionAr: 'يمكن للمستخدم إنشاء وتعديل وحذف إضافات المنتجات',
  },

  // Stock
  {
    module: PermissionModule.STOCK,
    code: 'stock.access',
    descriptionEn:
      'Allow user to view product quantities and stock levels of their assigned locations',
    descriptionAr:
      'السماح للمستخدم بعرض كميات المنتجات ومستويات المخزون للفروع المخصصة له',
  },
  {
    module: PermissionModule.STOCK,
    code: 'stock.record_draft',
    descriptionEn: 'User can issue stock-in and stock-out vouchers in draft',
    descriptionAr: 'يمكن للمستخدم إصدار سندات إدخال وإخراج المخزون كمسودة',
  },
  {
    module: PermissionModule.STOCK,
    code: 'stock.manage_movements',
    descriptionEn:
      'Allows the user to create, review, and confirm stock movement transactions to keep inventory records accurate',
    descriptionAr:
      'يتيح للمستخدم إنشاء ومراجعة واعتماد حركات المخزون للحفاظ على دقة سجلات المخزون',
  },
  {
    module: PermissionModule.STOCK,
    code: 'stock.manage_counts',
    descriptionEn: 'User can manage and confirm stock counts',
    descriptionAr: 'يمكن للمستخدم إدارة واعتماد عمليات جرد المخزون',
  },
  {
    module: PermissionModule.STOCK,
    code: 'stock.request_transfer',
    descriptionEn:
      'User can request stock to be moved between locations and they can cancel them if no action has been taken',
    descriptionAr:
      'يمكن للمستخدم طلب نقل المخزون بين الفروع، ويمكنه إلغاء الطلب في حال عدم اتخاذ أي إجراء عليه',
  },
  {
    module: PermissionModule.STOCK,
    code: 'stock.approve_transfer',
    descriptionEn:
      'User can approve or reject transfer requests from other locations',
    descriptionAr: 'يمكن للمستخدم قبول أو رفض طلبات النقل الواردة من فروع أخرى',
  },

  // Purchases & Suppliers
  {
    module: PermissionModule.PURCHASES_SUPPLIERS,
    code: 'purchases_suppliers.access',
    descriptionEn:
      'Allow user to view basic suppliers and purchase orders information',
    descriptionAr:
      'السماح للمستخدم بعرض المعلومات الأساسية للموردين وأوامر الشراء',
  },
  {
    module: PermissionModule.PURCHASES_SUPPLIERS,
    code: 'purchases_suppliers.record_draft',
    descriptionEn: 'User can record purchase orders in draft',
    descriptionAr: 'يمكن للمستخدم تسجيل أوامر الشراء كمسودة',
  },
  {
    module: PermissionModule.PURCHASES_SUPPLIERS,
    code: 'purchases_suppliers.manage_invoices',
    descriptionEn:
      'User can record, modify, confirm, and delete supplier purchase invoices',
    descriptionAr:
      'يمكن للمستخدم تسجيل وتعديل واعتماد وحذف فواتير شراء الموردين',
  },
  {
    module: PermissionModule.PURCHASES_SUPPLIERS,
    code: 'purchases_suppliers.record_returns',
    descriptionEn:
      'User can record credit notes for stock returned to suppliers',
    descriptionAr:
      'يمكن للمستخدم تسجيل إشعارات دائنة للمخزون المرتجع إلى الموردين',
  },
  {
    module: PermissionModule.PURCHASES_SUPPLIERS,
    code: 'purchases_suppliers.view_credit_balance',
    descriptionEn:
      "Allows the user to view suppliers' credit balances and outstanding amounts",
    descriptionAr:
      'يتيح للمستخدم عرض الأرصدة الدائنة والمبالغ المستحقة للموردين',
  },
  {
    module: PermissionModule.PURCHASES_SUPPLIERS,
    code: 'purchases_suppliers.manage_suppliers_payables',
    descriptionEn:
      'User can create, edit and delete suppliers, manage supplier payables and create settlements against supplier invoices',
    descriptionAr:
      'يمكن للمستخدم إنشاء وتعديل وحذف الموردين، وإدارة مستحقاتهم، وإنشاء تسويات لفواتيرهم',
  },

  // Expenses
  {
    module: PermissionModule.EXPENSES,
    code: 'expenses.access',
    descriptionEn: 'Allow user to view recorded expenses',
    descriptionAr: 'السماح للمستخدم بعرض المصروفات المسجلة',
  },
  {
    module: PermissionModule.EXPENSES,
    code: 'expenses.create',
    descriptionEn: 'User can add new expenses',
    descriptionAr: 'يمكن للمستخدم إضافة مصروفات جديدة',
  },
  {
    module: PermissionModule.EXPENSES,
    code: 'expenses.edit',
    descriptionEn: 'User can edit existing expenses',
    descriptionAr: 'يمكن للمستخدم تعديل المصروفات الحالية',
  },
  {
    module: PermissionModule.EXPENSES,
    code: 'expenses.delete',
    descriptionEn: 'User can delete existing expenses',
    descriptionAr: 'يمكن للمستخدم حذف المصروفات الحالية',
  },
  {
    module: PermissionModule.EXPENSES,
    code: 'expenses.view_cashflow_summary',
    descriptionEn:
      'User can view a summary of cashflow and financial data. This includes transactions, operating expenses, sales, returns, net income, and net tax.',
    descriptionAr:
      'يمكن للمستخدم عرض ملخص التدفق النقدي والبيانات المالية، ويشمل ذلك المعاملات والمصروفات التشغيلية والمبيعات والمرتجعات وصافي الدخل وصافي الضريبة',
  },
  {
    module: PermissionModule.EXPENSES,
    code: 'expenses.manage_wallet',
    descriptionEn:
      'User can record manual additions and withdrawals to the wallet balance',
    descriptionAr:
      'يمكن للمستخدم تسجيل الإضافات والسحوبات اليدوية لرصيد المحفظة',
  },

  // Accounting
  {
    module: PermissionModule.ACCOUNTING,
    code: 'accounting.access',
    descriptionEn: 'Allow user to view chart of accounts',
    descriptionAr: 'السماح للمستخدم بعرض دليل الحسابات',
  },
  {
    module: PermissionModule.ACCOUNTING,
    code: 'accounting.view_setup_guide',
    descriptionEn: 'User can view the accounting setup guide',
    descriptionAr: 'يمكن للمستخدم عرض دليل إعداد المحاسبة',
  },
  {
    module: PermissionModule.ACCOUNTING,
    code: 'accounting.manage_fixed_assets',
    descriptionEn: 'User can create, edit, and dispose of fixed assets',
    descriptionAr: 'يمكن للمستخدم إنشاء وتعديل والتصرف في الأصول الثابتة',
  },
  {
    module: PermissionModule.ACCOUNTING,
    code: 'accounting.manage_chart_of_accounts',
    descriptionEn:
      'User can modify the chart of accounts, including adding, editing, and deleting accounts',
    descriptionAr:
      'يمكن للمستخدم تعديل دليل الحسابات، بما في ذلك إضافة الحسابات وتعديلها وحذفها',
  },
  {
    module: PermissionModule.ACCOUNTING,
    code: 'accounting.record_journal_entries',
    descriptionEn: 'User can create and post manual journal entries',
    descriptionAr: 'يمكن للمستخدم إنشاء وترحيل القيود اليومية اليدوية',
  },
  {
    module: PermissionModule.ACCOUNTING,
    code: 'accounting.manage_journal_entries',
    descriptionEn: 'User can edit, reverse, or delete journal entries',
    descriptionAr: 'يمكن للمستخدم تعديل القيود اليومية أو عكسها أو حذفها',
  },
  {
    module: PermissionModule.ACCOUNTING,
    code: 'accounting.view_financial_reports',
    descriptionEn:
      'User can view all financial reports. This includes balance sheets, trial balance, account transactions, income statement, general ledger, and tax declaration.',
    descriptionAr:
      'يمكن للمستخدم عرض جميع التقارير المالية، ويشمل ذلك الميزانية العمومية وميزان المراجعة ومعاملات الحسابات وقائمة الدخل ودفتر الأستاذ العام والإقرار الضريبي',
  },

  // Dashboard
  {
    module: PermissionModule.DASHBOARD,
    code: 'dashboard.access',
    descriptionEn: 'Allow user to view analytics in home page',
    descriptionAr: 'السماح للمستخدم بعرض التحليلات في الصفحة الرئيسية',
  },
  {
    module: PermissionModule.DASHBOARD,
    code: 'dashboard.sales_insights',
    descriptionEn:
      'User can view sales insights such as top performing products and sales trends',
    descriptionAr:
      'يمكن للمستخدم عرض رؤى المبيعات مثل المنتجات الأكثر مبيعًا واتجاهات المبيعات',
  },
  {
    module: PermissionModule.DASHBOARD,
    code: 'dashboard.sales_breakdowns',
    descriptionEn:
      'User can view sales breakdown by locations, product and salesman',
    descriptionAr:
      'يمكن للمستخدم عرض تفاصيل المبيعات حسب الفروع والمنتج والبائع',
  },
  {
    module: PermissionModule.DASHBOARD,
    code: 'dashboard.view_financial_metrics',
    descriptionEn:
      "Allow the user to view financial performance data, including gross profit, net income, and today's inventory value.",
    descriptionAr:
      'السماح للمستخدم بعرض بيانات الأداء المالي، بما في ذلك إجمالي الربح وصافي الدخل وقيمة المخزون الحالية',
  },
  {
    module: PermissionModule.DASHBOARD,
    code: 'dashboard.view_register_insights',
    descriptionEn:
      'Allow user to view register insights such as cash drawer activity',
    descriptionAr: 'السماح للمستخدم بعرض رؤى السجلات مثل نشاط درج النقد',
  },

  // Reports
  {
    module: PermissionModule.REPORTS,
    code: 'reports.access',
    descriptionEn: 'Access reports',
    descriptionAr: 'الوصول إلى التقارير',
  },
  {
    module: PermissionModule.REPORTS,
    code: 'reports.view_sales_reports',
    descriptionEn:
      'User can view all sales reports. This includes location movement, customer movement, customer debit lifetime, and sales reports by time period, invoice, location, category, user, payment method, payment status, customer, and channel.',
    descriptionAr:
      'يمكن للمستخدم عرض جميع تقارير المبيعات، ويشمل ذلك حركة الفروع وحركة العملاء ومدة مديونية العميل وتقارير المبيعات حسب الفترة الزمنية والفاتورة والفرع والفئة والمستخدم وطريقة الدفع وحالة الدفع والعميل والقناة',
  },
  {
    module: PermissionModule.REPORTS,
    code: 'reports.view_products_stock_reports',
    descriptionEn:
      'User can view all inventory and stock control reports. This includes obsolete inventory, tracking information, product performance, product movement, supplier movement, supplier credit lifetime, purchase invoice details, stock count summary, and cost change.',
    descriptionAr:
      'يمكن للمستخدم عرض جميع تقارير المخزون ومراقبته، ويشمل ذلك المخزون الراكد ومعلومات التتبع وأداء المنتج وحركة المنتج وحركة الموردين ومدة مديونية المورد وتفاصيل فواتير الشراء وملخص الجرد وتغير التكلفة',
  },
  {
    module: PermissionModule.REPORTS,
    code: 'reports.view_financial_reports',
    descriptionEn:
      'User can view all financial reports. This includes balance sheets, trial balance, account transactions, income statement, general ledger, and tax declaration.',
    descriptionAr:
      'يمكن للمستخدم عرض جميع التقارير المالية، ويشمل ذلك الميزانية العمومية وميزان المراجعة ومعاملات الحسابات وقائمة الدخل ودفتر الأستاذ العام والإقرار الضريبي',
  },
  {
    module: PermissionModule.REPORTS,
    code: 'reports.view_tax_reports',
    descriptionEn:
      'User can view all tax reports. This includes tax declaration.',
    descriptionAr:
      'يمكن للمستخدم عرض جميع التقارير الضريبية، ويشمل ذلك الإقرار الضريبي',
  },
  {
    module: PermissionModule.REPORTS,
    code: 'reports.export_reports',
    descriptionEn: 'User can export reports they have access to as CSV files',
    descriptionAr:
      'يمكن للمستخدم تصدير التقارير التي يملك صلاحية الوصول إليها بصيغة CSV',
  },

  // Settings (Users/Roles/Locations management endpoints are real, built already;
  // general_account_setup/financial_settings are inert until those areas are built.
  // Rewaa's "Manage subscription and billing" is deliberately omitted — this is a
  // single-tenant, self-hosted system with no subscription/billing concept.)
  {
    module: PermissionModule.SETTINGS,
    code: 'settings.access',
    descriptionEn: 'Access settings',
    descriptionAr: 'الوصول إلى الإعدادات',
  },
  {
    module: PermissionModule.SETTINGS,
    code: 'settings.users.view',
    descriptionEn: 'View users',
    descriptionAr: 'عرض المستخدمين',
  },
  {
    module: PermissionModule.SETTINGS,
    code: 'settings.users.manage',
    descriptionEn: 'Create and manage users',
    descriptionAr: 'إنشاء وإدارة المستخدمين',
  },
  {
    module: PermissionModule.SETTINGS,
    code: 'settings.roles.view',
    descriptionEn: 'View roles and permissions',
    descriptionAr: 'عرض الأدوار والصلاحيات',
  },
  {
    module: PermissionModule.SETTINGS,
    code: 'settings.roles.manage',
    descriptionEn: 'Create and manage roles and permissions',
    descriptionAr: 'إنشاء وإدارة الأدوار والصلاحيات',
  },
  {
    module: PermissionModule.SETTINGS,
    code: 'settings.locations.manage',
    descriptionEn: 'Manage locations',
    descriptionAr: 'إدارة الفروع',
  },
  {
    module: PermissionModule.SETTINGS,
    code: 'settings.general_account_setup',
    descriptionEn:
      'User can view and manage general account configurations, such as company overview and custom fields',
    descriptionAr:
      'يمكن للمستخدم عرض وإدارة الإعدادات العامة للحساب، مثل نظرة عامة على الشركة والحقول المخصصة',
  },
  {
    module: PermissionModule.SETTINGS,
    code: 'settings.financial_settings',
    descriptionEn:
      'User can view and manage taxes, payment methods, and inventory configurations',
    descriptionAr:
      'يمكن للمستخدم عرض وإدارة الضرائب وطرق الدفع وإعدادات المخزون',
  },
];
