const pify = require('pify')

module.exports = discoverAndConnect

function discoverAndConnect({ node, clientId, count, peerConnectionTracker }) {
  // connect to all discovered nodes
  let naiveDiscoveredPeers = 0
  node.on('peer:discovery', async (peer) => {
    const peerId = peer.id.toB58String()
    // ignore discovering self
    if (clientId === peerId) return
    // abort if we have too many peers
    if (naiveDiscoveredPeers > count) return
    // abort if we're already connected
    if (peerConnectionTracker.has(peerId))

    // attempt connection!
    naiveDiscoveredPeers++
    try {
      await pify(cb => node.dial(peer, cb))()
    } catch (err) {
      // ignore failures
      naiveDiscoveredPeers--
      return
    }
    // listen for disconnect
    await listenUntilCondition(node, 'peer:disconnect', (peer2) => peerId === peer2.id.toB58String())
    naiveDiscoveredPeers--
  })
}

async function listenUntilCondition (ee, event, checkCondition) {
  const { promise, resolve } = deferredPromise()
  ee.on(event, eventHandler)
  function eventHandler (...args) {
    if (checkCondition(...args)) conditionMet(...args)
  }
  function conditionMet (...args) {
    ee.removeListener(event, eventHandler)
    resolve([...args])
  }
  return await promise
}

function deferredPromise () {
  let resolve, reject, promise = new Promise((_resolve, _reject) => { resolve = _resolve, reject = _reject })
  return { promise, resolve, reject }
}