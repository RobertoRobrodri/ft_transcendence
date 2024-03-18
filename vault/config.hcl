ui            = true
api_addr      = "https://localhost:8200"
cluster_addr  = "https://127.0.0.1:8201"
disable_mlock = true

// Filesystem storage
storage "raft" {
  path = "./vault/data"
  node_id = "node1"
}

// TCP Listener
listener "tcp" {
  address = "0.0.0.0:8201"
  tls_disable = "true"
}