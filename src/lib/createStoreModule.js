import { Observable } from "rxjs"
import _set from "lodash/set"

const createStoreModule = ({ name, pluralName: pluralN, provider }) => {
  const pluralName = pluralN || `${name}s`
  const nameCamel = camelize(name)
  const pluralNameCamel = camelize(pluralName)

  const initialState = {
    [pluralName]: [],
    isFetching: false,
    [name]: {},
    isFetchingItem: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false
  }
  const types = createActionsTypes({ name, pluralName })
  const actionsCreators = createActionsCreators({
    nameCamel,
    pluralNameCamel,
    types
  })
  const epics = createEpics({
    name,
    types,
    getProvider: getProviderInstance(provider)
  })
  const reducers = createReducers({ name, pluralName, initialState, types })
  //const getters = createSelectors({ name, pluralName });

  return {
    state: initialState,
    actionsCreators,
    epics,
    reducers,
    getProvider: getProviderInstance(provider)
  }
}

export default createStoreModule

const createActionsTypes = ({ name, pluralName }) => {
  const nameUppercase = name.toUpperCase()
  const pluralNameUppercase = pluralName.toUpperCase()

  return {
    FIND_REQUESTED: `FIND_${pluralNameUppercase}_REQUESTED`,
    FIND_FULFILLED: `FIND_${pluralNameUppercase}_FULFILLED`,
    FIND_FAILED: `FIND_${pluralNameUppercase}_FAILED`,

    COUNT_REQUESTED: `COUNT_${pluralNameUppercase}_REQUESTED`,
    COUNT_FULFILLED: `COUNT_${pluralNameUppercase}_FULFILLED`,
    COUNT_FAILED: `COUNT_${pluralNameUppercase}_FAILED`,

    FIND_ITEM_REQUESTED: `FIND_${nameUppercase}_REQUESTED`,
    FIND_ITEM_FULFILLED: `FIND_${nameUppercase}_FULFILLED`,
    FIND_ITEM_FAILED: `FIND_${nameUppercase}_FAILED`,

    GET_ITEM_REQUESTED: `GET_${nameUppercase}_REQUESTED`,
    GET_ITEM_FULFILLED: `GET_${nameUppercase}_FULFILLED`,
    GET_ITEM_FAILED: `GET_${nameUppercase}_FAILED`,

    CREATE_ITEM_REQUESTED: `CREATE_${nameUppercase}_REQUESTED`,
    CREATE_ITEM_FULFILLED: `CREATE_${nameUppercase}_FULFILLED`,
    CREATE_ITEM_FAILED: `CREATE_${nameUppercase}_FAILED`,

    UPDATE_ITEM_REQUESTED: `UPDATE_${nameUppercase}_REQUESTED`,
    UPDATE_ITEM_FULFILLED: `UPDATE_${nameUppercase}_FULFILLED`,
    UPDATE_ITEM_FAILED: `UPDATE_${nameUppercase}_FAILED`,

    UPDATE_REQUESTED: `UPDATE_${pluralNameUppercase}_REQUESTED`,
    UPDATE_FULFILLED: `UPDATE_${pluralNameUppercase}_FULFILLED`,
    UPDATE_FAILED: `UPDATE_${pluralNameUppercase}_FAILED`,

    DELETE_ITEM_REQUESTED: `DELETE_${nameUppercase}_REQUESTED`,
    DELETE_ITEM_FULFILLED: `DELETE_${nameUppercase}_FULFILLED`,
    DELETE_ITEM_FAILED: `DELETE_${nameUppercase}_FAILED`,

    OBSERVE_REQUESTED: `OBSERVE_${pluralNameUppercase}_REQUESTED`,
    OBSERVE_FULFILLED: `OBSERVE_${pluralNameUppercase}_FULFILLED`,
    OBSERVE_RECEIVE: `OBSERVE_${pluralNameUppercase}_RECEIVE`,
    OBSERVE_FAILED: `OBSERVE_${pluralNameUppercase}_FAILED`,

    OBSERVE_ITEM_REQUESTED: `OBSERVE_${nameUppercase}_REQUESTED`,
    OBSERVE_ITEM_FULFILLED: `OBSERVE_${nameUppercase}_FULFILLED`,
    OBSERVE_ITEM_RECEIVE: `OBSERVE_${nameUppercase}_RECEIVE`,
    OBSERVE_ITEM_FAILED: `OBSERVE_${nameUppercase}_FAILED`
  }
}

const createActionsCreators = ({ nameCamel, pluralNameCamel, types }) => {
  const createActionCreator = actionType => (data, options) => ({
    type: actionType,
    payload: {
      data,
      options
    }
  })

  return {
    [`find${pluralNameCamel}`]: createActionCreator(types.FIND_REQUESTED),
    [`count${pluralNameCamel}`]: createActionCreator(types.COUNT_REQUESTED),
    [`find${nameCamel}`]: createActionCreator(types.FIND_REQUESTED),
    [`get${nameCamel}`]: createActionCreator(types.GET_ITEM_REQUESTED),
    [`create${nameCamel}`]: createActionCreator(types.CREATE_ITEM_REQUESTED),
    [`update${nameCamel}`]: createActionCreator(types.UPDATE_ITEM_REQUESTED),
    [`update${pluralNameCamel}`]: createActionCreator(types.UPDATE_REQUESTED),
    [`delete${nameCamel}`]: createActionCreator(types.DELETE_ITEM_REQUESTED)
  }
}

const createEpics = ({ name, types, getProvider }) => {
  const find = action$ => {
    const actionTypes = [
      types.FIND_REQUESTED,
      types.FIND_FULFILLED,
      types.FIND_FAILED
    ]
    return createEpic({ action$, method: "find", types: actionTypes })
  }

  const count = action$ => {
    const actionTypes = [
      types.COUNT_REQUESTED,
      types.COUNT_FULFILLED,
      types.COUNT_FAILED
    ]
    return createEpic({ action$, method: "count", types: actionTypes })
  }

  const findById = action$ => {
    const actionTypes = [
      types.GET_ITEM_REQUESTED,
      types.GET_ITEM_FULFILLED,
      types.GET_ITEM_FAILED
    ]
    return createEpic({ action$, method: "findById", types: actionTypes })
  }

  const findOne = action$ => {
    const actionTypes = [
      types.FIND_ITEM_REQUESTED,
      types.FIND_ITEM_FULFILLED,
      types.FIND_ITEM_FAILED
    ]
    return createEpic({ action$, method: "findOne", types: actionTypes })
  }

  const create = action$ => {
    const actionTypes = [
      types.CREATE_ITEM_REQUESTED,
      types.CREATE_ITEM_FULFILLED,
      types.CREATE_ITEM_FAILED
    ]
    return createEpic({ action$, method: "create", types: actionTypes })
  }

  const update = action$ => {
    const actionTypes = [
      types.UPDATE_ITEM_REQUESTED,
      types.UPDATE_ITEM_FULFILLED,
      types.UPDATE_ITEM_FAILED
    ]
    return createEpic({ action$, method: "update", types: actionTypes })
  }

  const updateAll = action$ => {
    const actionTypes = [
      types.UPDATE_REQUESTED,
      types.UPDATE_FULFILLED,
      types.UPDATE_FAILED
    ]
    return createEpic({
      action$,
      method: "updateAll",
      types: actionTypes
    })
  }

  const _delete = action$ => {
    const actionTypes = [
      types.DELETE_ITEM_REQUESTED,
      types.DELETE_ITEM_FULFILLED,
      types.DELETE_ITEM_FAILED
    ]
    return createEpic({ action$, method: "delete", types: actionTypes })
  }

  function createEpic({ action$, method, types }) {
    const methodFn = async ({ type, payload = {} }) => {
      const providerInstance = await getProvider()
      const { options, data } = payload
      return providerInstance[method]({ resourceName: name, ...data })
          .then(response => ({
            data: response,
            options
          }))
    }

    return action$.ofType(types[0]).switchMap(action =>
        Observable.fromPromise(methodFn(action))
            .map(payload => ({ type: types[1], payload }))
            .catch(error =>
                Observable.of({
                  type: types[3],
                  payload: error,
                  error: true
                })
            )
    )
  }

  return [find, count, findById, findOne, create, update, updateAll, _delete]
}

const createReducers = ({
                          name,
                          pluralName,
                          initialState,
                          types,
                          options = {}
                        }) => {
  const applyStateAtPath = (state, key, data, options = {}) => {
    const mountPath = options.mountPath ? `${options.mountPath}.${key}` : key
    _set(state, mountPath, data)
  }

  const reducers = {
    // find
    [types.FIND_REQUESTED]: (state, { data, options }) => {
      applyStateAtPath(state, "isFetching", true)
      applyStateAtPath(state, pluralName, null)
    },
    [types.FIND_FULFILLED]: (state, { data, options }) => {
      applyStateAtPath(state, "isFetching", false)
      applyStateAtPath(state, "isFetchingErrored", false)
      applyStateAtPath(state, pluralName, data)
    },
    [types.FIND_FAILED]: (state, { data, options }) => {
      applyStateAtPath(state, "isFetching", false)
      applyStateAtPath(state, "isFetchingErrored", true)
    },

    // count
    [types.COUNT_REQUESTED]: (state, { data, options }) => {
      applyStateAtPath(state, "isFetchingCount", true)
      applyStateAtPath(state, "count", null)
    },
    [types.COUNT_FULFILLED]: (state, { data, options }) => {
      const count = data.count
      applyStateAtPath(state, "isFetchingCount", false)
      applyStateAtPath(state, "isFetchingCountErrored", false)
      applyStateAtPath(state, "count", count)
    },
    [types.COUNT_FAILED]: (state, { data, options }) => {
      applyStateAtPath(state, "isFetchingCount", false)
      applyStateAtPath(state, "isFetchingCountErrored", true)
    },

    // find item
    [types.FIND_ITEM_REQUESTED]: (state, { data, options }) => {
      applyStateAtPath(state, "isFetchingItem", true)
      applyStateAtPath(state, name, null)
    },
    [types.FIND_ITEM_FULFILLED]: (state, { data, options }) => {
      applyStateAtPath(state, "isFetchingItem", false)
      applyStateAtPath(state, name, data)
    },
    [types.FIND_ITEM_FAILED]: (state, { data, options }) => {
      applyStateAtPath(state, "isFetchingItem", false)
      applyStateAtPath(state, "isFetchingItemErrored", true)
    },

    // get item
    [types.GET_ITEM_REQUESTED]: (state, { data, options }) => {
      applyStateAtPath(state, "isFetchingItem", true)
      applyStateAtPath(state, name, null)
    },
    [types.GET_ITEM_FULFILLED]: (state, { data, options }) => {
      applyStateAtPath(state, "isFetchingItem", false)
      applyStateAtPath(state, name, data)
    },
    [types.GET_ITEM_FAILED]: (state, { data, options }) => {
      applyStateAtPath(state, "isFetchingItem", false)
      applyStateAtPath(state, "isFetchingItemErrored", true)
    },

    // create
    [types.CREATE_ITEM_REQUESTED]: (state, { data, options }) => {
      applyStateAtPath(state, "isCreatingItem", true)
    },
    [types.CREATE_ITEM_FULFILLED]: (state, { data, options }) => {
      applyStateAtPath(state, "isCreatingItem", false)
    },
    [types.CREATE_ITEM_FAILED]: (state, { data, options }) => {
      applyStateAtPath(state, "isCreatingItem", false)
      applyStateAtPath(state, "isCreatingItemErrored", true)
    },

    // update
    [types.UPDATE_ITEM_REQUESTED]: (state, { data, options }) => {
      applyStateAtPath(state, "isUpdatingItem", true)
    },
    [types.UPDATE_ITEM_FULFILLED]: (state, { data, options }) => {
      applyStateAtPath(state, "isUpdatingItem", false)
    },
    [types.UPDATE_ITEM_FAILED]: (state, { data, options }) => {
      applyStateAtPath(state, "isUpdatingItem", false)
      applyStateAtPath(state, "isUpdatingItemErrored", true)
    },

    // updateAll
    [types.UPDATE_REQUESTED]: (state, { data, options }) => {
      applyStateAtPath(state, "isUpdating", true)
    },
    [types.UPDATE_FULFILLED]: (state, { data, options }) => {
      applyStateAtPath(state, "isUpdating", false)
    },
    [types.UPDATE_FAILED]: (state, { data, options }) => {
      applyStateAtPath(state, "isUpdating", false)
      applyStateAtPath(state, "isUpdatingErrored", true)
    },

    [types.DELETE_ITEM_REQUESTED]: state => {},
    [types.DELETE_ITEM_FULFILLED]: state => {},
    [types.DELETE_ITEM_FAILED]: state => {},

    [types.OBSERVE_REQUESTED]: (state, { data, options }) => {
      applyStateAtPath(state, pluralName, null)
    },
    [types.OBSERVE_FULFILLED]: (state, { data, options }) => {
      const mountPath = `${options.mountPath || pluralName}ObserveData`
      applyStateAtPath(state, mountPath, data)
    },
    [types.OBSERVE_RECEIVE]: (state, { data, options }) => {
      applyStateAtPath(state, pluralName, data)
    },
    [types.OBSERVE_FAILED]: state => {},

    [types.OBSERVE_ITEM_REQUESTED]: (state, { data, options }) => {
      applyStateAtPath(state, name, null)
    },
    [types.OBSERVE_ITEM_FULFILLED]: (state, { data, options }) => {
      const mountPath = `${options.mountPath || name}ObserveData`
      applyStateAtPath(state, mountPath, data)
    },
    [types.OBSERVE_ITEM_RECEIVE]: (state, { data, options }) => {
      applyStateAtPath(state, name, data)
    },
    [types.OBSERVE_ITEM_FAILED]: state => {}
  }

  return (state = initialState, { type, payload = {} }) => {
    if (reducers[type]) {
      reducers[type](state, payload)
      return {
        ...state
      }
    }

    return state
  }
}

/**
 * Method to create the getters
 * @param name
 * @param pluralName
 * @returns {{}}
 */
const createSelectors = ({ name, pluralName }) => {
  const nameCamel = camelize(name)
  const pluralNameCamel = camelize(pluralName)

  return {
    [name]: state => state[name],
    [pluralName]: state => state[pluralName],
    [`${pluralName}Hash`]: state =>
        (state[pluralName] || []).reduce((hash, value) => {
          hash[value.id] = value
          return hash
        }, {}),
    [`isFetching${nameCamel}`]: state => state.isFetchingItem,
    [`isFetching${pluralNameCamel}`]: state => state.isFetching
  }
}

const getRequiredProviderMethods = () => [
  "find",
  "count",
  "findOne",
  "findById",
  "create",
  "update",
  "updateAll",
  "delete",
  "makeRequest"
]

const validateProvider = provider => {
  const requiredMethods = getRequiredProviderMethods()

  const notImplementedMethods = requiredMethods.filter(
      methodString => typeof provider[methodString] !== "function"
  )

  if (notImplementedMethods.length > 0) {
    throw new Error(
        `
            Invalid provider instance. 
            The provided provider instance does not implement 
            the following required methods: `,
        notImplementedMethods.join(", ")
    )
  }

  provider._isValidProvider = true
  return provider
}

function getProviderInstance(provider) {
  return async () => {
    let _provider = provider
    if (typeof provider === "function") {
      _provider = await provider()
    }

    return _provider._isValidProvider ? _provider : validateProvider(_provider)
  }
}

function camelize(str) {
  const _str = str
      .replace(
          /(?:^\w|[A-Z]|\b\w)/g,
          (letter, index) =>
              index === 0 ? letter.toLowerCase() : letter.toUpperCase()
      )
      .replace(/\s+/g, "")

  return _str.charAt(0).toUpperCase() + _str.slice(1)
}
