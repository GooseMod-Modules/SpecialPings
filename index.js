import Webpack from '@goosemod/webpack';
import Patcher from '@goosemod/patcher';
import { getOwnerInstance, getNodeInternals } from '@goosemod/reactUtils';

const toPing = [];

const audio = new Audio();
audio.src = 'https://cdn.discordapp.com/attachments/947256914314678292/958057735155515412/honk.mp3';


const createHook = (e) => {
  if (!(toPing.find((x) => x[0] === e.channelId && e.message.content.includes(x[1] + '>')))) return;
  audio.play();
};

const { getGuild } = Webpack.findByProps('getGuildCount');

let contextPatch;

export default {
goosemodHandlers: {
  onImport: () => {
    Webpack.findByProps('register')._subscriptions.MESSAGE_CREATE.add(createHook);

    contextPatch = Patcher.contextMenu.patch('message', {
      label: 'Special Ping',
      
      sub: () => {
        let info;
        try {
          info = getNodeInternals(getOwnerInstance(document.getElementById('message'))).return.return.memoizedProps;
        } catch (e) { return; }

        const channelId = info.channel.id;
        const guildId = info.channel.guild_id;
        const mentionedRoles = info.message.mentionRoles;

        const guildRoles = getGuild(guildId).roles;

        console.log('WOW', guildId, guildRoles, mentionedRoles, guildRoles[mentionedRoles[0]].name);

        return [
          ...mentionedRoles.map((x) => ({
            label: guildRoles[x].name,
            checked: (toPing.find((y) => y[0] === channelId && y[1] === x) && true) || false,

            action: () => {
              const cur = toPing.find((y) => y[0] === channelId && y[1] === x);

              if (cur) toPing.splice(toPing.indexOf(cur), 1);
                else toPing.push([ channelId, x ]);
            }
          }))
        ];
      }
    });
  },

  onRemove: () => {
    Webpack.findByProps('register')._subscriptions.MESSAGE_CREATE.delete(createHook);
    contextPatch();
  },

  getSettings: () => [toPing],
  loadSettings: ([_toPing]) => {
    toPing = _toPing;
  }
}
};