const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    ComponentType,
    PermissionsBitField
} = require('discord.js');

const Config = require('./config');

//  CONFIG
const TOKEN = Config.TOKEN;
const SUGGESTIONS_CHANNEL_ID = Config.Suggestions_CHANNEL_ID;
const FEEDBACK_CHANNEL_ID = Config.Feedback_CHANNEL_ID;
const ADMIN_ROLE_ID = Config.Admin_ROLE_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('clientReady', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);

    let i = 0;
    setInterval(() => {
        const serverCount = client.guilds.cache.size;

        const activities = [
            { name: `dev: KJL`, type: 3 },
            { name: `Dream Store: 🚀`, type: 2 }
        ];

        client.user.setPresence({
            activities: [{ name: activities[i].name, type: activities[i].type }],
            status: 'online',
        });

        i = (i + 1) % activities.length;
    }, 10000);
});

const voteData = new Map();

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.channel.id === SUGGESTIONS_CHANNEL_ID) {
        const suggestionText = message.content;
        const author = message.author;

        try {
            await message.delete();
        } catch (err) {
            console.error("Failed to delete message:", err);
        }

        const embed = new EmbedBuilder()
            .setTitle('💡 New Suggestion')
            .setDescription(suggestionText)
            .setColor(0x0099FF)
            .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
            .addFields(
                // { name: 'Author', value: `${author}`, inline: true },
                { name: '⬆️ Up Votes', value: '✅ 0', inline: true },
                { name: '⬇️ Down Votes', value: '❌ 0', inline: true },
                { name: 'Status', value: '⏳ Pending', inline: false }
            )
            .setTimestamp();

        const voteRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`upvote_${author.id}`)
                .setLabel(' Upvote')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⬆️'),
            new ButtonBuilder()
                .setCustomId(`downvote_${author.id}`)
                .setLabel(' Downvote')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⬇️')
        );

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`action_${author.id}`)
                .setLabel('⚙️ Action')
                .setStyle(ButtonStyle.Secondary)
        );

        const sentMessage = await message.channel.send({ 
            embeds: [embed], 
            components: [voteRow, actionRow] 
        });

        voteData.set(sentMessage.id, new Map());

        async function updateVoteCounts() {
            const votes = voteData.get(sentMessage.id);
            if (!votes) return;

            let up = 0, down = 0;
            for (const vote of votes.values()) {
                if (vote === 'up') up++;
                else if (vote === 'down') down++;
            }

            const oldEmbed = sentMessage.embeds[0];
            const updatedEmbed = EmbedBuilder.from(oldEmbed)
                .setFields(
                    // { name: 'Author', value: oldEmbed.fields[0].value, inline: true },
                    { name: ' Up Votes', value: `✅ ${up}`, inline: true },
                    { name: ' Down Votes', value: `❌ ${down}`, inline: true },
                    { name: 'Status', value: oldEmbed.fields[2].value, inline: false }
                );

            await sentMessage.edit({ embeds: [updatedEmbed] });
        }

        const buttonCollector = sentMessage.createMessageComponentCollector({ 
            componentType: ComponentType.Button,
            time: 7 * 24 * 60 * 60 * 1000
        });

        buttonCollector.on('collect', async (interaction) => {
            if (interaction.customId.startsWith('upvote_') || interaction.customId.startsWith('downvote_')) {
                const voteType = interaction.customId.startsWith('upvote_') ? 'up' : 'down';
                const suggestionAuthorId = interaction.customId.split('_')[1];
                const userId = interaction.user.id;

                let votes = voteData.get(sentMessage.id);
                if (!votes) {
                    votes = new Map();
                    voteData.set(sentMessage.id, votes);
                }

                const currentVote = votes.get(userId);

                if (currentVote === voteType) {
                    votes.delete(userId);
                } else {
                    votes.set(userId, voteType);
                }

                await updateVoteCounts();

                await interaction.deferUpdate();
            }

            else if (interaction.customId.startsWith('action_')) {
                const suggestionAuthorId = interaction.customId.split('_')[1];

                const member = interaction.member;
                const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator) ||
                                (ADMIN_ROLE_ID && member.roles.cache.has(ADMIN_ROLE_ID));

                if (!isAdmin) {
                    return interaction.reply({ content: '❌ You do not have permission to use this button.', ephemeral: true });
                }

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`status_${sentMessage.id}_${suggestionAuthorId}`)
                    .setPlaceholder('Choose a new status...')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Approve')
                            .setDescription('Mark as approved')
                            .setValue('approve')
                            .setEmoji('✅'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Reject')
                            .setDescription('Mark as rejected')
                            .setValue('reject')
                            .setEmoji('❌'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('In Progress')
                            .setDescription('Mark as in progress')
                            .setValue('progress')
                            .setEmoji('🔄')
                    );

                const row = new ActionRowBuilder().addComponents(selectMenu);
                await interaction.reply({ content: 'Select the new status:', components: [row], ephemeral: true });
            }
        });

        const selectCollector = client.on('interactionCreate', async (interaction) => {
            if (!interaction.isStringSelectMenu()) return;
            if (!interaction.customId.startsWith('status_')) return;

            const [_, messageId, authorId] = interaction.customId.split('_');
            if (messageId !== sentMessage.id) return;

            const selectedValue = interaction.values[0];
            let newStatus = '';
            let color = 0x0099FF;

            switch (selectedValue) {
                case 'approve':
                    newStatus = '✅ Approved';
                    color = 0x00FF00;
                    break;
                case 'reject':
                    newStatus = '❌ Rejected';
                    color = 0xFF0000;
                    break;
                case 'progress':
                    newStatus = '🔄 In Progress';
                    color = 0xFFA500;
                    break;
                default:
                    return;
            }

            const oldEmbed = sentMessage.embeds[0];
            const updatedEmbed = EmbedBuilder.from(oldEmbed)
                .setColor(color)
                .setFields(
                    // { name: 'Author', value: oldEmbed.fields[0].value, inline: true },
                    { name: ' Up Votes', value: oldEmbed.fields[0].value, inline: true },
                    { name: ' Down Votes', value: oldEmbed.fields[1].value, inline: true },
                    { name: 'Status', value: newStatus, inline: false }
                );

            const disabledActionRow = ActionRowBuilder.from(sentMessage.components[1]).setComponents(
                ButtonBuilder.from(sentMessage.components[1].components[0]).setDisabled(true)
            );

            await sentMessage.edit({ embeds: [updatedEmbed], components: [sentMessage.components[0], disabledActionRow] });

            try {
                const user = await client.users.fetch(authorId);
                await user.send(`Your suggestion has been **${newStatus}**:\n"${oldEmbed.description}"`);
            } catch (e) {
                console.log('Could not DM the user.');
            }

            await interaction.reply({ content: `✅ Status updated to **${newStatus}**.`, ephemeral: true });
        });
    }

    else if (message.channel.id === FEEDBACK_CHANNEL_ID) {
        const feedbackText = message.content;
        const author = message.author;

        try {
            await message.delete();
        } catch (err) {
            console.error("Failed to delete message:", err);
        }

        // Create star selection menu
        const select = new StringSelectMenuBuilder()
            .setCustomId('feedback_stars')
            .setPlaceholder('Choose star rating...')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('5 stars').setValue('⭐⭐⭐⭐⭐').setEmoji('🌟'),
                new StringSelectMenuOptionBuilder().setLabel('4 stars').setValue('⭐⭐⭐⭐').setEmoji('⭐'),
                new StringSelectMenuOptionBuilder().setLabel('3 stars').setValue('⭐⭐⭐').setEmoji('✨'),
                new StringSelectMenuOptionBuilder().setLabel('2 stars').setValue('⭐⭐').setEmoji('🔸'),
                new StringSelectMenuOptionBuilder().setLabel('1 star').setValue('⭐').setEmoji('🔻')
            );

        const row = new ActionRowBuilder().addComponents(select);

        const response = await message.channel.send({
            content: `${author}, please select your rating:`,
            components: [row],
        });

        const collector = response.createMessageComponentCollector({ 
            componentType: ComponentType.StringSelect,
            time: 60000 
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== author.id) {
                return interaction.reply({ content: 'This menu is not for you!', ephemeral: true });
            }

            const stars = interaction.values[0];

            const feedbackEmbed = new EmbedBuilder()
                .setTitle('⭐ New Feedback')
                .setDescription(feedbackText)
                .setColor(0xFFD700)
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .addFields(
                    { name: 'By', value: `${author}` },
                    { name: 'Rating', value: stars }
                )
                .setTimestamp();

            await response.delete();
            await message.channel.send({ embeds: [feedbackEmbed] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                response.edit({ content: '⌛ Time expired. Please submit your feedback again.', components: [] });
            }
        });
    }
});

client.login(TOKEN);
