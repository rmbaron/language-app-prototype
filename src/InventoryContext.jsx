import { createContext, useContext, useState, useCallback } from 'react'
import { assembleInventory } from './inventory'
import { getActiveLanguage } from './learnerProfile'

const InventoryContext = createContext(null)

export function InventoryProvider({ children }) {
  const [inventory, setInventory] = useState(() => assembleInventory(getActiveLanguage()))

  const refreshInventory = useCallback(() => {
    setInventory(assembleInventory(getActiveLanguage()))
  }, [])

  return (
    <InventoryContext.Provider value={{ inventory, refreshInventory }}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  return useContext(InventoryContext)
}
