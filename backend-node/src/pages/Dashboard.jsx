import Hero from '../components/Hero'
import ProductGrid from '../components/ProductGrid'

export default function Dashboard() {
  return (
    <div className="grid gap-6">
      <Hero />
      <ProductGrid />
    </div>
  )
}
