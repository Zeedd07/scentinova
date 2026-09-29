/**
 * Dependent State -> City comboboxes for Indian addresses. Emits canonical
 * dataset names; the city list only ever contains cities of the chosen state.
 */
import { useEffect, useState } from 'react'
import Combobox from './Combobox'
import { loadIndiaCities, loadIndiaStates } from '../../lib/indiaLocations'

const stateLabel = (s) => s.name
const stateAliases = (s) => [s.code]

export default function IndiaStateCityFields({
  state,
  stateCode,
  city,
  errors = {},
  onStateChange,
  onCityChange,
  onError,
  stateRef,
  cityRef,
}) {
  const [states, setStates] = useState([])
  const [statesStatus, setStatesStatus] = useState('loading')
  const [statesAttempt, setStatesAttempt] = useState(0)

  const [cities, setCities] = useState({ code: '', list: [] })
  const [citiesStatus, setCitiesStatus] = useState('idle')
  const [citiesAttempt, setCitiesAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatesStatus('loading')
    loadIndiaStates()
      .then((list) => {
        if (cancelled) return
        setStates(list)
        setStatesStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatesStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [statesAttempt])

  useEffect(() => {
    if (!stateCode) {
      setCitiesStatus('idle')
      return undefined
    }
    let cancelled = false
    setCitiesStatus('loading')
    loadIndiaCities(stateCode)
      .then((list) => {
        if (cancelled) return
        setCities({ code: stateCode, list })
        setCitiesStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setCitiesStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [stateCode, citiesAttempt])

  const cityOptions = cities.code === stateCode ? cities.list : []

  return (
    <>
      <Combobox
        ref={stateRef}
        id="checkout-state"
        label="State"
        required
        name="state"
        autoComplete="address-level1"
        options={states}
        getLabel={stateLabel}
        getAliases={stateAliases}
        value={state}
        onChange={(option) => onStateChange(option)}
        onInvalid={() => onError('state', 'Please select your state from the list.')}
        placeholder="Select your state"
        loading={statesStatus === 'loading'}
        loadingText="Loading states…"
        loadError={statesStatus === 'error' ? 'Could not load states.' : ''}
        onRetry={() => setStatesAttempt((n) => n + 1)}
        emptyText="No states found."
        error={errors.state}
      />
      <Combobox
        ref={cityRef}
        id="checkout-city"
        label="City"
        required
        name="city"
        autoComplete="address-level2"
        options={cityOptions}
        value={city}
        onChange={(option) => onCityChange(option || '')}
        onInvalid={() => onError('city', `Please select a city in ${state || 'your state'} from the list.`)}
        placeholder="Select your city"
        disabled={!stateCode}
        disabledPlaceholder="Select a state first"
        loading={citiesStatus === 'loading'}
        loadingText="Loading cities…"
        loadError={citiesStatus === 'error' ? 'Could not load cities.' : ''}
        onRetry={() => setCitiesAttempt((n) => n + 1)}
        emptyText="No cities found."
        error={errors.city}
      />
    </>
  )
}
