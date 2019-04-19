const React = require('react')
const ObservableStore = require('obs-store')
const GraphContainer = require('react-force-directed/src/GraphContainer')
const ForceGraph = require('react-force-directed/src/ForceGraph')
const {
  createNode,
  createLink,
} = require('react-force-directed/src/util')
const {
  buildGraphBasicNodes,
  buildGraphAddMissingNodes,
} = require('../common/graph-viz')


class DhtGraph extends React.Component {

  constructor () {
    super()
    // prepare empty graph
    this.graph = { nodes: [], links: [], container: { width: 0, height: 0 } }
    // contain graph in observable store
    this.graphStore = new ObservableStore(this.graph)
    // bind for listener
    this.rebuildGraph = this.rebuildGraph.bind(this)
  }

  componentDidMount () {
    const { store } = this.props
    store.subscribe(this.rebuildGraph)
    this.rebuildGraph(store.getState())
  }

  componentWillUnmount () {
    const { store } = this.props
    store.unsubscribe(this.rebuildGraph)
  }

  rebuildGraph (state) {
    console.log('DhtGraph.rebuildGraph', state)
    const { nodes, links } = buildGraphForDht(state)
    console.log({ nodes, links })
    this.graphStore.updateState({ nodes, links })
  }

  onResize (size) {
    this.graphStore.updateState({ container: size })
  }

  render () {
    const actions = {
      selectNode: console.log
    }

    return (
      <div ref={this.containerRef} style={{ width: '100%', height: '100%' }}>
        <GraphContainer onSize={size => this.onResize(size)}>
          <ForceGraph graphStore={this.graphStore} actions={actions}/>
        </GraphContainer>
        {ForceGraph.createStyle()}
      </div>
    )
  }
}

module.exports = DhtGraph


function buildGraphForDht (appState) {
  const graph = { nodes: [], links: [] }

  // const { networkState, selectedNode } = appState
  const clientsData = appState.clients
  if (!clientsData) return graph

  buildGraphBasicNodes(clientsData, graph)
  buildGraphDhtLinks(clientsData, graph)

  // recolor nodes in dht experiment "hello"
  // color green if they were part of the getMany response
  // recolorNodesForGroupNumber(appState, graph)

  return graph
}

function buildGraphDhtLinks (networkState, graph) {
  // build links from stats
  Object.entries(networkState).forEach(([clientId, clientData]) => {
    const dhtData = clientData.dht || {}
    const peers = dhtData.routingTable
    if (!peers) return

    const links = peers.map(({ id: peerId }) => {
      const source = clientId
      const target = peerId
      return createLink({
        source,
        target,
      })
    })

    graph.links = graph.links.concat(links)
  })

  buildGraphAddMissingNodes(graph)
}

function recolorNodesForGroupNumber (appState, graph) {
  const { networkState, selectedNode } = appState
  const clientsData = networkState.clients
  // if no selectedNode, we're done
  if (!selectedNode) return
  const selectedNodeState = clientsData[selectedNode]

  // abort if data is missing
  if (!selectedNodeState) return
  if (!selectedNodeState.dht) return

  // color matching nodes
  const dhtQueriedNodes = selectedNodeState.dht.hello.map(entry => entry.from)
  graph.nodes.forEach((node) => {
    if (dhtQueriedNodes.includes(node.id)) {
      node.color = colors.green
    }
  })
}