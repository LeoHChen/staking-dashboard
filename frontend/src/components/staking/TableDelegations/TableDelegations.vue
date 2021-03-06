<template>
  <div>
    <BaseGrid
      :sort="sort"
      :columns="columns"
      :data="showingValidators"
      :onRowClick="onClickValidator"
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex"
import orderBy from "lodash.orderby"

import {
  percent,
  shortDecimals,
  atoms,
  ones,
  fourDecimals,
  twoDecimals
} from "scripts/num"

import BaseGrid from "src/components/ui/BaseGrid"
import ValidatorStatus from "../components/ValidatorStatus"
import ValidatorName from "../components/ValidatorName"

export default {
  name: `table-delegations`,
  components: {
    BaseGrid
  },
  props: {
    data: {
      type: Array,
      required: true
    },
    showOnMobile: {
      type: String,
      default: () => "returns"
    },
    isUndelegation: {
      type: Boolean,
      default: () => false
    }
  },
  data: () => ({
    query: ``,
    sort: {
      property: `stake`,
      order: `desc`
    },
    showing: 15,
    rollingWindow: 10000 // param of slashing period
  }),
  computed: {
    ...mapState([`distribution`, `pool`, `session`, "delegates"]),
    ...mapState({
      annualProvision: state => state.minting.annualProvision
    }),
    ...mapGetters([`committedDelegations`, `bondDenom`, `lastHeader`]),
    sortedEnrichedValidators() {
      return orderBy(
        this.data.slice(0),
        [this.sort.property],
        [this.sort.order]
      )
    },
    showingValidators() {
      return this.sortedEnrichedValidators.slice(0, this.showing)
    },
    columns() {
      let columns = [
        {
          title: `Status`,
          value: `status`,
          tooltip: `The validator's status`,
          width: "96px",
          renderComponent: ValidatorStatus // render as Component - use custom Vue components
        },
        {
          title: `Name`,
          value: `name`,
          tooltip: `The validator's moniker`,
          renderComponent: ValidatorName // render as Component - use custom Vue components
        },
        {
          title: `Stake`,
          value: `stake`,
          tooltip: `Stake of validator`,
          width: "160px",
          render: value => twoDecimals(ones(value)) + " ONE"
        }
      ]

      if (this.isUndelegation) {
        columns = columns.concat([
          {
            title: `Ending in`,
            value: `remaining_epoch`,
            tooltip: `Ending in`,
            align: "right",
            width: "160px",
            render: value => value + " epochs"
          }
        ])
      } else {
        columns = columns.concat([
          {
            title: `Reward (up to date)`,
            value: `rewards`,
            tooltip: `Reward (up to date)`,
            width: "200px",
            render: value => fourDecimals(ones(value)) + " ONE"
          },
          {
            title: `APR %`,
            value: `apr`,
            tooltip: `APR %`,
            width: "140px",
            align: "right",
            render: value => percent(value)
          }
        ])
      }

      if (this.$mq === "tab") {
        const keep = ["name", "apr", "stake", "remaining_epoch", "apr"]
        columns = columns.filter(p => keep.includes(p.value))
      }
      if (this.$mq === "sm" || this.$mq === "md") {
        const keep = ["name", "remaining_epoch", "apr", "stake"]
        columns = columns.filter(p => keep.includes(p.value))
      }

      return columns
    }
  },
  watch: {
    "sort.property": function() {
      this.showing = 15
    },
    "sort.order": function() {
      this.showing = 15
    }
  },
  mounted() {
    this.$store.dispatch(`getPool`)
    this.$store.dispatch(`getRewardsFromMyValidators`)
    this.$store.dispatch(`getMintingParameters`)
  },
  methods: {
    loadMore() {
      this.showing += 10
    },
    onClickValidator(validator) {
      this.$router.push({
        name: "validator",
        params: { validator: validator.operator_address }
      })
    }
  }
}
</script>
<style scoped lang="scss">
table {
  margin-top: var(--unit);
  thead {
    text-transform: uppercase;
    font-weight: bold;
  }
}

@media screen and (max-width: 414px) {
}
</style>
