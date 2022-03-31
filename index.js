import Webpack from '@goosemod/webpack';
import Patcher from '@goosemod/patcher';
import { getOwnerInstance, getNodeInternals } from '@goosemod/reactUtils';

let toPing = [];

const audio = new Audio();
audio.src = 'https://cdn.discordapp.com/attachments/958047577922740345/958118222341767248/Final_Fantasy_VII_Sound_Effects_-_Save_and_Load.mp3'; // Default


const createHook = (e) => {
  if (!(toPing.find((x) => x[0] === e.channelId && (e.message.content.includes(x[1] + '>') || x[1] === '@everyone' && e.message.mention_everyone)))) return;
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
        // const mentionedRoles = info.message.mentionRoles;
        const mentionedRoles = [...new Set([...info.message.content.matchAll(/<@&([0-9]{17,18})>/g)].map((x) => x[1]))];

        const guildRoles = getGuild(guildId).roles;

        const items = mentionedRoles.map((x) => ({
          label: guildRoles[x].name,
          checked: (toPing.find((y) => y[0] === channelId && y[1] === x) && true) || false,

          action: () => {
            const cur = toPing.find((y) => y[0] === channelId && y[1] === x);

            if (cur) toPing.splice(toPing.indexOf(cur), 1);
              else toPing.push([ channelId, x ]);
          }
        }));

        if (info.message.mentionEveryone) items.push({
          label: '@everyone',
          checked: (toPing.find((y) => y[0] === channelId && y[1] === '@everyone') && true) || false,
          
          action: () => {
            const cur = toPing.find((y) => y[0] === channelId && y[1] === '@everyone');

            if (cur) toPing.splice(toPing.indexOf(cur), 1);
              else toPing.push([ channelId, '@everyone' ]);
          }
        });

        return items;
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