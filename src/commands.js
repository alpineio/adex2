import { InteractionResponseType } from 'discord-interactions';
import { findProject, authorizeUser } from './alpinestatus';
import { InteractionResponseFlags } from 'discord-interactions';
/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */
const applicationId = process.env.DISCORD_APPLICATION_ID;
const createResponder = (interaction) => (body) =>
  fetch(`https://discord.com/api/v8/interactions/${applicationId}/${interaction.token}/callback`, {
    method: 'POST',
    body: JSON.stringify(body),
  });


export default {
  dex: {
    name: 'dex',
    description: "Search Alpine's database for client projects",
    options: [
      {
        name: 'search',
        description: 'A portion of the project name or url to search for',
        type: 3,
        required: true
      }
    ],
    handler: async (msg) => {
      // Interaction specific response function
      const respond = createResponder(msg);

      const requestor = msg.member.user.id;
      const searchTerm = msg.data.options[0].value;

      // Handle search asynchronously
      findProject(requestor, searchTerm)
        .then(async (results) => {
          // If the request was unauthorized, send an update
          if (results.status === 401) {
            return respond({
              content: 'You are not authorized to use this command',
              flags: InteractionResponseFlags.EPHEMERAL
            });
          }

          results = await results.json();

          // No results, send an update
          if (results.length === 0) {
            return respond({
              content: 'No results found',
              flags: InteractionResponseFlags.EPHEMERAL
            })
          }

          respond({
            content: `Found ${results.length} results`,
            flags: InteractionResponseFlags.EPHEMERAL
          });

          // Format results into Discord embeds
          const embeds = results.map((result) => ({
            title: result.name,
            url: result.url,
            description: result.description
          }));

          // Split embeds into chunks of 10 (max allowed by Discord)
          const chunks = [];
          for (let i = 0; i < embeds.length; i += 10) {
            chunks.push(embeds.slice(i, i + 10));
          }
          chunks.forEach(chunk => {
            respond({
              embeds: chunk,
              flags: InteractionResponseFlags.EPHEMERAL
            })
          })
        }).catch(e => {
          respond({
            content: 'Error searching for project',
            flags: InteractionResponseFlags.EPHEMERAL
          })
        });

      // Send a response to the user that we're working on it
      return {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      }
    }
  },
  auth: {
    name: 'Authorize SSO',
    description: 'Authorize a Discord user to use Dex',
    options: [
      {
        name: 'user',
        description: 'The Discord user to authorize',
        type: 6,
        required: true
      }, {
        name: 'email',
        description: 'The email address to use for SSO',
        type: 3,
        required: true
      }
    ],
    handler: async (msg) => {
      // Make sure the email address is valid
      const respond = createResponder(msg);

      // Associate the email address with the user
      authorizeUser(
        msg.member.user.id,         // Sending discord user
        msg.data.options[0].value,  // Discord user to authorize
        msg.data.options[1].value   // Email address to use for SSO
      ).then(res => {

        if (res.status === 401) {
          return respond({
            content: 'You are not authorized to use this command',
            flags: InteractionResponseFlags.EPHEMERAL
          });
        }

        if (res.status === 200) {
          return respond({
            content: 'User authorized',
            flags: InteractionResponseFlags.EPHEMERAL
          });
        }

        throw new Error(res);

      }).catch(e => {
        console.error(e);
        respond({
          content: 'Error authorizing user',
          flags: InteractionResponseFlags.EPHEMERAL
        })
      });

      return {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        flags: InteractionResponseFlags.EPHEMERAL
      }
    }
  }
}