import { useEffect, useState } from 'react'

const slides = [
  { id: 1, title: 'Electrónica destacada', subtitle: 'Smartphones, laptops y más', accent: '#FFD700' },
  { id: 2, title: 'Gadgets de alto rendimiento', subtitle: 'Audio, wearables y accesorios', accent: '#1E90FF' },
  { id: 3, title: 'Innovación eficiente', subtitle: 'Tecnología sostenible y de vanguardia', accent: '#32CD32' },
]

export default function Hero() {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setCurrent((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [])

  const s = slides[current]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-br from-[#222] to-[#1a1a1a] p-10 mb-8">
      <div className="transition-opacity duration-500 ease-out opacity-100">
        <h2 className="text-4xl md:text-5xl font-semibold" style={{ color: s.accent }}>{s.title}</h2>
        <p className="text-gray-300 mt-2">{s.subtitle}</p>
        <div className="mt-6 flex gap-3">
          <button className="btn btn-gold">Ver catálogo</button>
          <button className="btn btn-blue">Ofertas tech</button>
        </div>
      </div>
    </div>
  )
}
