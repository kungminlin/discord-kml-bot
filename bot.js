const Discord = require('discord.js');
const client = new Discord.Client();

// Winston Logger Configuration
const winston = require('winston');
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.timestamp(),
		winston.format.align(),
		winston.format.printf(info => {
			const {
				timestamp, level, message, ...args
			} = info;

			const ts = timestamp.slice(0, 19).replace('T', ' ');
			return `${ts} [${level}] ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
		})
	),
	transports: [
		new (winston.transports.Console)({
			level: 'debug',
			handleExceptions: true,
			json: false,
			colorize: true,
			timestamp: true
		})
	]
});

winston.addColors({
	error: 'red',
	warn: 'yellow',
	info: 'cyan',
	debug: 'green'
})

// Authorization and Discord Bot Configurations
const auth = require('./auth.json')
const prefix = "!"
const commands = {
	"assign": {
		description: "",
		usage: "",
		authority: 2
	},
	"kick": {
		description: "",
		usage: "",
		authority: 2
	},
	"ban": {
		description: "",
		usage: "",
		authority; 3
	}
}

// Bot Listeners
client.on('ready', () => {
	logger.info(`Bot registered on ${client.guilds.first()} as ${client.user.tag}.`); // This bot is only open on one guild.
});

client.on('guildMemberAdd', member => {
	const channel = member.guild.channels.find(ch => ch.name === 'announcements')
	channel.send(`Welcome to the server, ${member}! Hope you enjoy this intellectual feast!`);
})

client.on('message', async message => {
	if (message.author.bot || message.content.indexOf(prefix) !== 0) return;
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	logger.info(`User ${message.author.tag} executed the command ${command.toUpperCase()} with the arguments: [${args.join(', ')}]`)

	if (message.member.highestRole.position < commands[command].authority) {
		message.reply(`You are not authorized to use the command ${command}.`);
		logger.warn(`User ${message.author.tag} does not have the authority to execute command ${command.toUpperCase()}`);
		return;
	}


	switch(command) {
		// `ASSIGN` Command
		case 'assign':
			let role = message.guild.roles.find(r => r.name === args[1]);
			var member;
			if (message.mentions.members.first()) {
				member = message.mentions.members.first();
			} else {
				let user = client.users.find(m => m.username === args[0]);
				if (!user) {
					message.reply(`User ${args[0]} is not found.`);
					logger.warn(`User ${args[0]} is not found.`)
					return;
				}
				member = message.guild.members.get(user.id);
			}
			
			if (!role) {
				message.reply(`The role you have designated, "${args[1]}", does not exist.`);
				logger.warn(`The role "${args[1]} does not exist."`)
				return;
			}

			if (member.highestRole.position >= 2 || role.position >= 2) {
				message.reply(`You do not have enough authority to assign ${member} to ${role.name}.`);
				logger.warn(`User ${message.author.tag} does not have the authority to assign ${member.user.tag} to the role ${role.name}`)
				return;
			}

			await member.addRole(role)
				.catch(error => {
					message.reply(`${member} could not be assigned to the role "${role.name}" because of the following error: ${error}`);
					logger.error(`Fatal error: ${error}`)
				})
			message.reply(`You have assigned ${member} to ${role.name}.`);
			logger.info(`${message.author.tag} has successfully assigned ${member.user.tag} to the role ${role.name}.`);
			break;

		// `BAN` Command
		case 'ban':
			var member;
			if (message.mentions.members.first()) {
				member = message.mentions.members.first();
			} else {
				let user = client.users.find(m => m.username === args[0]);
				if (!user) {
					message.reply(`User ${args[0]} is not found.`);
					logger.warn(`User ${args[0]} is not found.`)
					return;
				}
				member = message.guild.members.get(user.id);
			}

			if (!member.bannable) {
				message.reply(`You are not authorized to ban ${member}.`);
				logger.warn(`User ${message.author.tag} does not have the authority to ban ${member.user.tag}.`)
				return;
			}

			let reason = args.slice(1).join(' ');
			if (!reason || reason.trim() === "") {
				reason = "No reason provided."
				logger.warn(`${message.author.tag} provided no reason for banning ${member.user.tag}.`)
			}

			await member.ban(reason)
				.catch(error => {
					message.reply(`${member} could not be banned because of the following error: ${error}`);
					logger.error(`Fatal error: ${error}`)
				})
			message.reply(`${member.user.tag} has been banned by ${message.author.tag} because of: ${reason}`)
			break;

		default:
			message.reply(`Here are the available commands:`
	}
});

client.login(auth.token);