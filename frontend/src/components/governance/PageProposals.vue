<template>
  <TmPage
    data-title="Proposals"
    :managed="true"
    :loading="proposals.loading"
    :loaded="proposals.loaded"
    :error="proposals.error"
    :data-empty="Object.keys(proposals.proposals).length === 0"
    hide-header
  >
    <template slot="no-data">
      <!-- duplicated, I have no proper way of refactoring this -->
      <div class="button-container">
        <TmBtn
          id="propose-btn"
          value="Create Proposal"
          type="secondary"
          @click.native="onPropose"
        />
      </div>
      <TmDataMsg
        title="No Governance Proposals"
        subtitle="There are currently no governance proposals to display.
    Click the 'Create Proposal' button to submit a proposal."
        icon="gavel"
      />
    </template>
    <template slot="managed-body">
      <!-- duplicated, I have no proper way of refactoring this -->
      <div class="button-container">
        <TmBtn
          id="propose-btn"
          value="Create Proposal"
          type="secondary"
          @click.native="onPropose"
        />
      </div>
      <TableProposals
        :proposals="proposals.proposals"
        :loading="proposals.loading"
      />
    </template>

    <ModalPropose ref="modalPropose" :denom="depositDenom" />
  </TmPage>
</template>

<script>
import ModalPropose from "src/ActionModal/components/ModalPropose"
import TableProposals from "governance/TableProposals"
import TmBtn from "common/TmBtn"
import TmPage from "common/TmPage"
import TmDataMsg from "common/TmDataMsg"
import { mapState, mapGetters } from "vuex"
export default {
  name: `page-proposals`,
  components: {
    ModalPropose,
    TableProposals,
    TmDataMsg,
    TmBtn,
    TmPage
  },
  computed: {
    ...mapState([`proposals`]),
    ...mapGetters([`depositDenom`])
  },
  mounted() {
    this.$store.dispatch(`getProposals`)
  },
  methods: {
    onPropose() {
      this.$refs.modalPropose.open()
    }
  }
}
</script>
<style scoped>
.button-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  padding: 1rem 1rem 0 1rem;
  max-width: 680px;
  margin: 0 auto;
}

@media screen and (max-width: 667px) {
  .button-container {
    justify-content: center;
  }

  .button-container button {
    width: 50%;
  }
}
</style>
