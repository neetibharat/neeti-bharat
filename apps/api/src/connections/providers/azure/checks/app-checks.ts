import type { AzureApi } from '../azure-api';
import {
  MAX_ONE_BY_ONE,
  WEB_API_VERSION,
  belongsTo,
  described,
  fulfilled,
  refusedAmong,
  virtualMachines,
  webApps,
  type WebApp,
  type WebAppConfig,
} from './azure-lists';
import { judge, type AzureCheck, type Found, type Verdict } from './outcome';
import { rule, weakTlsVersion } from './rules';

type Config = NonNullable<WebAppConfig['properties']>;

/** Each web app with its own settings. An app whose settings cannot be read is left out, or reported as no access. */
async function configsOf(
  api: AzureApi,
  subscriptionId: string,
): Promise<{ app: WebApp; config: Config }[]> {
  const apps = (await webApps(api, subscriptionId))
    .filter((app) => belongsTo(app, subscriptionId))
    .slice(0, MAX_ONE_BY_ONE);
  const read = await Promise.allSettled(
    apps.map(async (app) => {
      const settings = await api.arm.get<WebAppConfig>(
        `${app.id}/config/web?api-version=${WEB_API_VERSION}`,
      );
      return { app, config: settings.properties ?? {} };
    }),
  );
  refusedAmong(read);
  return fulfilled(read);
}

/** A check on one setting of each web app and function app, named as Azure names it. */
const configRule = (
  id: AzureCheck['id'],
  setting: keyof Config,
  verdict: (config: Config) => Verdict,
): AzureCheck => ({
  id,
  run: async (api, subscriptionId) =>
    judge(
      await configsOf(api, subscriptionId),
      ({ config }) => verdict(config),
      ({ app, config }) => described(app, { [setting]: config[setting] }),
    ),
});

const noIdentity = ({ identity }: { identity?: { type?: string } }): boolean =>
  !identity?.type || identity.type === 'None';

const identityType = ({ identity }: { identity?: { type?: string } }): Found => ({
  'identity.type': identity?.type,
});

/** Plain HTTP is turned away, so what travels to the app is encrypted. */
export const webAppHttps = rule(
  'webapp_https',
  webApps,
  ({ properties }): Verdict => (properties?.httpsOnly === false ? 'fail' : 'ok'),
  ({ properties }) => ({ httpsOnly: properties?.httpsOnly }),
);

export const webAppTls = configRule('webapp_tls', 'minTlsVersion', ({ minTlsVersion }) =>
  weakTlsVersion(minTlsVersion) ? 'fail' : 'ok',
);

/** A debugger that can be attached from outside is a way in. */
export const webAppRemoteDebugging = configRule(
  'webapp_remote_debugging',
  'remoteDebuggingEnabled',
  (config) => (config.remoteDebuggingEnabled === true ? 'fail' : 'ok'),
);

/** Files are sent over FTPS, or not at all: plain FTP sends passwords in the clear. */
export const webAppFtp = configRule('webapp_ftp', 'ftpsState', (config) =>
  config.ftpsState === 'AllAllowed' ? 'fail' : 'ok',
);

/** An identity of its own lets the app reach other services without a password kept in its settings. */
export const webAppIdentity = rule(
  'webapp_identity',
  webApps,
  (app): Verdict => (noIdentity(app) ? 'warn' : 'ok'),
  identityType,
);

export const vmIdentity = rule(
  'vm_identity',
  virtualMachines,
  (vm): Verdict => (noIdentity(vm) ? 'warn' : 'ok'),
  identityType,
);

/** A Linux machine that accepts a password can be guessed at: keys are used instead. */
export const vmSshPassword = rule(
  'vm_ssh_password',
  virtualMachines,
  ({ properties }): Verdict => {
    const linux = properties?.osProfile?.linuxConfiguration;
    return linux && linux.disablePasswordAuthentication !== true ? 'warn' : 'ok';
  },
  ({ properties }) => ({
    disablePasswordAuthentication:
      properties?.osProfile?.linuxConfiguration?.disablePasswordAuthentication,
  }),
);

/** Only a machine that says outright that secure boot is off. One without the setting does not offer it. */
export const vmSecureBoot = rule(
  'vm_secure_boot',
  virtualMachines,
  ({ properties }): Verdict =>
    properties?.securityProfile?.uefiSettings?.secureBootEnabled === false ? 'warn' : 'ok',
  ({ properties }) => ({
    secureBootEnabled: properties?.securityProfile?.uefiSettings?.secureBootEnabled,
  }),
);
