package router

import (
	"embed"
	"net/http"
	"path"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func SetWebRouter(router *gin.Engine, buildFS embed.FS, indexPage []byte, nextIndexPage []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(static.Serve("/new", common.EmbedFolderWithPrefix(buildFS, "web-next/dist", "/new")))
	router.Use(static.Serve("/", common.EmbedFolder(buildFS, "web/dist")))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		requestPath := c.Request.URL.Path
		if strings.HasPrefix(requestPath, "/v1") || strings.HasPrefix(requestPath, "/api") || strings.HasPrefix(requestPath, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		if strings.HasPrefix(requestPath, "/new/assets") || (strings.HasPrefix(requestPath, "/new/") && path.Ext(requestPath) != "") {
			c.Status(http.StatusNotFound)
			return
		}
		c.Header("Cache-Control", "no-cache")
		if requestPath == "/new" || strings.HasPrefix(requestPath, "/new/") {
			c.Data(http.StatusOK, "text/html; charset=utf-8", nextIndexPage)
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})
}
