import Vue from "vue"
import config from "src/config"
import { TNode } from "@/connectors/node"
import { Module } from "vuex"
import { fetchNetworks, fetchNetworkInfo } from "../../mock-service"
import { setNetwork as setNetworkToExtension } from "@/scripts/extension-utils"
import { POLLING_TIMEOUT_SEC } from "@/constants/time-constants"

const DEFAULT_NETWORK = process.env.DEFAULT_NETWORK

export interface INetworkConfig {
  id: string
  chain_id: string
  chain_title: string
  testnet: boolean
  title: string
  rpc_url: string
  explorer_url: string
  __typename: string
}

export interface INetworkInfo {
  effective_median_stake: number
  total_one_staked: number
  current_block_number: number
  current_block_hash: string
  "total-supply": string
  "circulating-supply": string
  "epoch-last-block": string
  "total-staking": string
  "median-raw-stake": string
  time_next_epoch: string
}

const state = {
  stopConnecting: false,
  connected: false,
  lastHeader: {
    height: 0,
    chain_id: `1`
  },
  networkConfig: {} as INetworkConfig,
  network: DEFAULT_NETWORK,
  connectionAttempts: 0,
  externals: {} as { config: typeof config; node: TNode },
  networks: Array<INetworkConfig>(),
  networkInfo: {} as INetworkInfo,
  isNetworkInfoLoading: false
}

let interval: any

export default ({ node }: { node: TNode }): Module<typeof state, any> => ({
  // get tendermint RPC client from basecoin client

  state: {
    ...state,
    externals: {
      config,
      node
    }
  },

  // mutations: {
  //   stopConnecting(state, stop = true) {
  //     Vue.set(state, `stopConnecting`, stop)
  //   },
  //   setConnected(state, connected) {
  //     if (connected) {
  //       state.connectionAttempts = 0
  //     }
  //     Vue.set(state, `connected`, connected)
  //   },
  //   increaseConnectionAttempts(state) {
  //     state.connectionAttempts = state.connectionAttempts + 1
  //   },
  //   resetConnectionAttempts(state) {
  //     state.connectionAttempts = 0
  //   },
  //   setRpcUrl(state, rpcUrl) {
  //     console.log(state.rpcUrl, rpcUrl)
  //     state.rpcUrl = rpcUrl
  //   },
  //   setNetworkId(state, networkId) {
  //     state.network = networkId
  //   }
  // },

  mutations: {
    setNetwork(state, networkConfig: INetworkConfig) {
      state.networkConfig = networkConfig
      state.network = networkConfig.id
      state.lastHeader = { height: 0, ...networkConfig }
    },
    setConnected(state, connected) {
      Vue.set(state, `connected`, connected)
    },
    setNetworks(state, networks: INetworkConfig[]) {
      state.networks = networks
    },
    setNetworkInfo(state, networkInfo: INetworkInfo) {
      state.networkInfo = networkInfo
      state.isNetworkInfoLoading = true

      // console.log(
      //   "time_next_epoch: ",
      //   networkInfo.time_next_epoch,
      //   (networkInfo.time_next_epoch / 3600).toFixed(3)
      // )
    }
  },

  actions: {
    async setLastHeader() {},

    async init({ state, dispatch, commit }) {
      const networks: INetworkConfig[] = await fetchNetworks()

      const network = networks.find(network => network.id === state.network)

      if (!interval) {
        interval = setInterval(
          () => dispatch("loadNetworkInfo"),
          POLLING_TIMEOUT_SEC * 1000
        )
      }

      commit("setNetworks", networks)
      dispatch("setNetwork", network || networks[0])
      dispatch("loadNetworkInfo")
    },

    async reconnect({ commit, state, rootState }) {
      await node.staking.initHarmony(
        state.networkConfig.rpc_url,
        state.networkConfig.chain_id
      )

      setNetworkToExtension(state.networkConfig)

      commit("setConnected", true)

      // store.dispatch("getDelegates");
    },

    async loadNetworkInfo({ commit, state }) {
      const networkInfo = await fetchNetworkInfo(state.networkConfig.id)

      commit("setNetworkInfo", networkInfo)
    },

    // async connect({ commit, state }) {
    //   await node.get.initHarmony(
    //     state.networkConfig.rpc_url,
    //     state.networkConfig.chain_id
    //   )
    //
    //   commit("setConnected", true)
    // },

    async rpcSubscribe() {},
    checkNodeHalted() {},

    async setNetwork({ state, commit, dispatch }, network) {
      commit("setNetwork", network)
      dispatch("reconnect")
    }
  }
})

// const NODE_HALTED_TIMEOUT = config.node_halted_timeout
// const MAX_CONNECTION_ATTEMPTS = 5

// actions: {
//   async setLastHeader({ state }, header) {
//     state.lastHeader = header
//   },
//   reconnect({ commit, dispatch }) {
//     commit("resetConnectionAttempts")
//     commit("stopConnecting", false)
//     dispatch("connect")
//   },
//   async connect({ state, commit, dispatch }) {
//     const {
//       externals: { node },
//       rpcUrl,
//       connectionAttempts,
//       stopConnecting
//     } = state
//
//     if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
//       commit("stopConnecting")
//       return
//     }
//     if (stopConnecting) return
//
//     commit(`setConnected`, false)
//     try {
//       await node.tendermint.connect(rpcUrl)
//       node.tendermint.ondisconnect = () => {
//         commit(`setConnected`, false)
//         dispatch(`connect`)
//       }
//       commit(`setConnected`, true)
//       dispatch(`reconnected`)
//       dispatch(`rpcSubscribe`)
//       dispatch(`subscribeToBlocks`)
//     } catch (err) {
//       console.log(`Failed reconnect attempt`)
//       commit("increaseConnectionAttempts")
//       setTimeout(() => {
//         dispatch(`connect`)
//       }, 1000)
//     }
//   },
//   async rpcSubscribe({ commit, dispatch, rootState }) {
//     const { node } = state.externals
//     if (state.stopConnecting) return
//
//     node.tendermint.status().then(status => {
//       dispatch(`setLastHeader`, {
//         height: status.sync_info.latest_block_height,
//         chain_id: status.node_info.network
//       })
//
//       if (status.node_info.network === `testnet`) {
//         commit(`setInsecureMode`)
//       }
//     })
//
//     node.tendermint.subscribe(
//       {
//         query: `tm.event = 'NewBlockHeader'`
//       },
//       ({ header }) => {
//         dispatch(`setLastHeader`, header)
//       }
//     )
//     if (rootState.session.signedIn) {
//       dispatch(`walletSubscribe`)
//     }
//     dispatch(`checkNodeHalted`)
//   },
//   checkNodeHalted(
//     { state, dispatch },
//     nodeHaltedTimeout = NODE_HALTED_TIMEOUT
//   ) {
//     state.nodeHaltedTimeout = setTimeout(() => {
//       if (!state.lastHeader.height) {
//         dispatch(`nodeHasHalted`)
//       }
//     }, nodeHaltedTimeout) // default 30s
//   },
//   async setNetwork({ commit, dispatch }, network) {
//     commit("setNetworkId", network.id)
//     commit("setRpcUrl", network.rpc_url)
//     dispatch("reconnect")
//     console.info(
//       `Connecting to: ${network.title} (${network.chain_id}) – ${network.rpc_url}`
//     )
//   }
// },
