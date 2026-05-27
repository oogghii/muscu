import { formatWeight } from '../lib/utils'

export default function Stepper({ value, onChange, step = 1, min = 0, isWeight = false }) {
  const dec = () => onChange(v => {
    const next = parseFloat((v - step).toFixed(2))
    return Math.max(min, next)
  })
  const inc = () => onChange(v => parseFloat((v + step).toFixed(2)))

  const display = isWeight ? formatWeight(value) : value

  const handleInput = (e) => {
    const raw = parseFloat(e.target.value)
    if (!isNaN(raw) && raw >= min) onChange(raw)
  }

  return (
    <div className="stepper">
      <button className="stepper__btn" onClick={dec} type="button">−</button>
      <input
        className="stepper__value"
        type="number"
        value={display}
        onChange={handleInput}
        inputMode="decimal"
        min={min}
        step={step}
      />
      <button className="stepper__btn" onClick={inc} type="button">+</button>
    </div>
  )
}
