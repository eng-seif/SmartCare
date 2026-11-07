import { catalogReference, catalogObservedAt } from '@/lib/catalog-reference'

export default function CatalogReferenceNotice({ title, ar = false, compact = false }: { title: string; ar?: boolean; compact?: boolean }) {
  const reference = catalogReference(title)
  if (!reference) return null
  return <div className={compact ? 'fh-serving' : 'text-xs text-secondary space-y-1'} data-no-translate={ar ? true : undefined}>
    {!compact && <p>{ar ? 'سعر استرشادي من متجر خارجي؛ ليس سعرًا مؤكدًا لفتح الله.' : 'Reference retail price; not a confirmed Fathalla price.'}</p>}
    <p><a href={reference.source} target="_blank" rel="noopener noreferrer" className="underline">
      {ar ? 'مصدر السعر الاسترشادي' : 'Price reference'}
    </a>{compact ? <> · {ar ? 'صورة توضيحية' : 'Illustrative image'}</> : <> · {catalogObservedAt}</>}</p>
    {!compact && <p>{ar ? 'صورة توضيحية مولّدة بالذكاء الاصطناعي.' : 'Illustrative AI-generated image.'}</p>}
    {!compact && <p>{ar ? 'الباركود كود داخلي للكتالوج، وليس باركود مصنع.' : "The barcode is an internal catalog code, not a manufacturer's barcode."}</p>}
  </div>
}
