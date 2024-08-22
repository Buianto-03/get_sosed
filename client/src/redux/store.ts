import { configureStore } from '@reduxjs/toolkit'
import advertReducer from './slices/adverts/advertsSlice'

export const store = configureStore({
  reducer: {
    advert: advertReducer,

  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

