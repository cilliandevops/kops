// config/config.go
package config

import (
	"log"
	"fmt"
	"github.com/spf13/viper"
)

type Config struct {
	Server struct {
		Port string
	}
	K8s struct {
		ConfigPath string
	}
}

var Cfg Config

func LoadConfig() {
	viper.SetConfigFile("config/config.yaml")
	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Error reading config file, %s", err)
	}
	if err := viper.Unmarshal(&Cfg); err != nil {
		log.Fatalf("Unable to decode into struct, %v", err)
	}
	// 输出配置值
	fmt.Println("Server Port:", Cfg.Server.Port)
	fmt.Println("K8s Config Path:", Cfg.K8s.ConfigPath)
}
