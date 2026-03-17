package oauth

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

const OAuthRedirectPathSessionKey = "oauth_redirect_path"

func GetRedirectURI(c *gin.Context, fallbackPath string) string {
	redirectPath := fallbackPath
	session := sessions.Default(c)
	if session != nil {
		if value := session.Get(OAuthRedirectPathSessionKey); value != nil {
			if path, ok := value.(string); ok && strings.HasPrefix(path, "/") && !strings.HasPrefix(path, "//") {
				redirectPath = path
			}
		}
	}

	if system_setting.ServerAddress != "" {
		return strings.TrimRight(system_setting.ServerAddress, "/") + redirectPath
	}

	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s%s", scheme, c.Request.Host, redirectPath)
}
