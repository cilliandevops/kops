package client

import (
	"database/sql"
	_ "github.com/lib/pq"
	"log"
)

func NewDBClient() *sql.DB {
	connStr := "user=username dbname=mydb sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}
	return db
}
