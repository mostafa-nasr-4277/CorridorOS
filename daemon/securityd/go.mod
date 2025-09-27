module github.com/corridoros/securityd

go 1.21

require (
	github.com/corridoros/security/confidential v0.0.0
	github.com/corridoros/security/pqc v0.0.0
	github.com/gorilla/mux v1.8.1
)

replace github.com/corridoros/security/pqc => ../../security/pqc

replace github.com/corridoros/security/confidential => ../../security/confidential
