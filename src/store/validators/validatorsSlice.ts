import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { Validator } from '@helium/http'
import { getElectedValidators, getValidators } from '../../utils/appDataClient'
import {
  CacheRecord,
  handleCacheFulfilled,
  hasValidCache,
} from '../../utils/cacheUtils'
import { deleteWallet, getWallet, postWallet } from '../../utils/walletClient'

export type ValidatorsSliceState = {
  validators: CacheRecord<{ data: Validator[] }>
  electedValidators: CacheRecord<{ data: Validator[] }>
  followedValidators: CacheRecord<{ data: Validator[] }>
  followedValidatorsObj: Record<string, Validator>
}

const initialState: ValidatorsSliceState = {
  validators: { lastFetchedTimestamp: 0, loading: false, data: [] },
  electedValidators: { lastFetchedTimestamp: 0, loading: false, data: [] },
  followedValidators: { lastFetchedTimestamp: 0, loading: false, data: [] },
  followedValidatorsObj: {},
}

export const fetchMyValidators = createAsyncThunk(
  'validators/fetchValidators',
  async (_arg, { getState }) => {
    const {
      validators: { validators },
    } = (await getState()) as {
      validators: ValidatorsSliceState
    }
    if (hasValidCache(validators)) return validators.data

    return getValidators()
  },
)

export const fetchElectedValidators = createAsyncThunk(
  'validators/fetchElectedValidators',
  async (_arg, { getState }) => {
    const {
      validators: { electedValidators },
    } = (await getState()) as {
      validators: ValidatorsSliceState
    }
    if (hasValidCache(electedValidators)) return electedValidators.data

    return getElectedValidators()
  },
)

export const fetchFollowedValidators = createAsyncThunk(
  'validators/fetchFollowedValidators',
  async (_arg, { getState }) => {
    const {
      validators: { followedValidators },
    } = (await getState()) as {
      validators: ValidatorsSliceState
    }
    if (hasValidCache(followedValidators)) return followedValidators.data

    return getWallet('validators/follow', null, { camelCase: true })
  },
)

export const followValidator = createAsyncThunk<Validator[], string>(
  'validators/followValidator',
  async (validator_address) => {
    const followed = await postWallet(
      `validators/follow/${validator_address}`,
      null,
      { camelCase: true },
    )
    return followed
  },
)

export const unfollowValidator = createAsyncThunk<Validator[], string>(
  'validators/unfollowValidator',
  async (validator_address) => {
    const followed = await deleteWallet(
      `validators/follow/${validator_address}`,
      null,
      { camelCase: true },
    )
    return followed
  },
)

const validatorsToObj = (validators: Validator[]) =>
  validators.reduce((obj, validator) => {
    return {
      ...obj,
      [validator.address]: validator,
    }
  }, {})

const validatorsSlice = createSlice({
  name: 'validatorDetails',
  initialState,
  reducers: {
    signOut: () => {
      return { ...initialState }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMyValidators.rejected, (state, _action) => {
      state.validators.loading = false
    })
    builder.addCase(fetchMyValidators.pending, (state, _action) => {
      state.validators.loading = true
    })
    builder.addCase(fetchMyValidators.fulfilled, (state, action) => {
      state.validators = handleCacheFulfilled({ data: action.payload })
    })
    builder.addCase(fetchElectedValidators.fulfilled, (state, action) => {
      state.electedValidators = handleCacheFulfilled({ data: action.payload })
    })
    builder.addCase(fetchFollowedValidators.fulfilled, (state, action) => {
      state.followedValidatorsObj = validatorsToObj(action.payload)
      state.followedValidators = handleCacheFulfilled({ data: action.payload })
    })
    builder.addCase(followValidator.fulfilled, (state, action) => {
      state.followedValidatorsObj = validatorsToObj(action.payload)
      state.followedValidators = handleCacheFulfilled({ data: action.payload })
    })
    builder.addCase(unfollowValidator.fulfilled, (state, action) => {
      state.followedValidatorsObj = validatorsToObj(action.payload)
      state.followedValidators = handleCacheFulfilled({ data: action.payload })
    })
  },
})

export default validatorsSlice
