'use client'
import { useEffect } from 'react'
import { translate } from '@/lib/i18n-ar'

const SKIP = 'script,style,textarea,.material-symbols-outlined,[data-no-translate]'
const ATTRS = ['placeholder', 'aria-label', 'title']

function tx(raw: string) {
    const core = raw.trim()
    if (!core) return raw
    const out = translate(core)
    return out === core ? raw : raw.replace(core, out)
}

function walk(node: Node) {
    if (node.nodeType === 3) {
        const p = node.parentElement
        if (p && !p.closest(SKIP)) { const v = node.nodeValue ?? ''; const n = tx(v); if (n !== v) node.nodeValue = n }
        return
    }
    if (node.nodeType !== 1) return
    const el = node as Element
    if (el.matches(SKIP)) return
    for (const a of ATTRS) { const v = el.getAttribute(a); if (v) { const n = tx(v); if (n !== v) el.setAttribute(a, n) } }
    el.childNodes.forEach(walk)
}

// Translates all visible English text to Arabic using the dictionary in lib/i18n-ar.ts
export default function Translator({ lang }: { lang: 'en' | 'ar' }) {
    useEffect(() => {
        if (lang !== 'ar') return
        walk(document.body)
        document.body.style.opacity = '1'
        const obs = new MutationObserver(ms => {
            for (const m of ms) {
                if (m.type === 'characterData') walk(m.target)
                else if (m.type === 'attributes') walk(m.target)
                else m.addedNodes.forEach(walk)
            }
        })
        obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS })
        return () => obs.disconnect()
    }, [lang])
    return null
}
