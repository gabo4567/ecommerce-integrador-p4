import CardProduct from './CardProduct'

const mock = [
  { id: 1, title: 'Laptop Pro 16"', price: 1499, stock: 5 },
  { id: 2, title: 'Smartphone Ultra', price: 999, stock: 10 },
  { id: 3, title: 'Wireless Headphones', price: 199, stock: 20 },
  { id: 4, title: '4K Monitor 27"', price: 399, stock: 8 },
]

export default function ProductGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {mock.map(p => (
        <div key={p.id} className="card-dark p-4">
          <CardProduct title={p.title} price={p.price} stock={p.stock} actionLabel="Ver más" onAction={() => {}} />
        </div>
      ))}
    </div>
  )
}
