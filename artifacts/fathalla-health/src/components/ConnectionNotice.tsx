import { cookies } from 'next/headers'

export default async function ConnectionNotice() {
  const ar = (await cookies()).get('lang')?.value === 'ar'
  return (
    <aside role="status" className="mx-auto my-5 max-w-5xl rounded-xl border border-outline-variant bg-surface-container-low px-5 py-4 text-on-surface">
      <h2 className="font-semibold">
        {ar ? 'إعدادات الاتصال غير مكتملة' : 'Database connection not configured'}
      </h2>
      <p className="mt-1 text-sm leading-relaxed">
        {ar
          ? 'مساعد التغذية متاح للإرشادات العامة. عرض المنتجات والحسابات والسلة يحتاج إعدادات Supabase الخاصة بمشروعك. لم يتم تغيير قاعدة البيانات أو إضافة بيانات تجريبية.'
          : 'The nutrition assistant is available for general guidance. Products, accounts and cart require your project’s Supabase settings. Your database has not been changed and no demo products have been added.'}
      </p>
    </aside>
  )
}
