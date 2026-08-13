import config from "@/config"
import stripePlugin from "./stripe/manifest"

/** Plugins instalados en este proyecto (orden de carga). */
const INSTALLED_PLUGINS = [stripePlugin]

export function getInstalledPlugins() {
  return INSTALLED_PLUGINS
}

export function getPlugin(id) {
  return INSTALLED_PLUGINS.find((plugin) => plugin.id === id) ?? null
}

export function isPluginEnabled(plugin) {
  if (!plugin?.featureKey) return true
  return Boolean(config.features?.[plugin.featureKey])
}
