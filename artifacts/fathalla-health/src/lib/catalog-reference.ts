import catalog from '@/data/catalog-additions.json'

const byTitle = new Map(catalog.products.map(p => [p.title, p]))
export const catalogReference = (title: string) => byTitle.get(title)
export const catalogObservedAt = catalog.observedAt
