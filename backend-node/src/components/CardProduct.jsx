export default function CardProduct({ title, price, stock, onAction, actionLabel }) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-1 text-white">{title}</h3>
      <p className="text-sm text-gray-300">Precio: ${price}</p>
      <p className="text-sm text-gray-400 mb-3">Stock: {stock}</p>
      {onAction && (
        <button className="btn btn-gold" onClick={onAction}>
          {actionLabel || 'Acción'}
        </button>
      )}
    </div>
  )
}
