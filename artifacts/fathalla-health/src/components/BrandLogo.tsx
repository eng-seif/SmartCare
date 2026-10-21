import imglogo from '../../public/ff3c7892-4675-4db9-bbca-d2fd99fcef2c_clogo-2021-05-27-11-52-43-qFz1XkNc4RBUPtlXhXf2TAXX.webp'

// The supplied logo has a black background, so it sits in a black rounded tile (works in both themes).
export default function BrandLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-block shrink-0 overflow-hidden rounded-lg bg-black ${className}`} style={{ width: size, height: size }}>
      <img alt="Fathalla" src={imglogo.src} width={size} height={size} className="brand-img w-full h-full object-cover scale-125" />
    </span>
  )
}
