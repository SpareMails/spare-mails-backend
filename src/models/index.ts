import Domain from './Domain';
import TemporaryEmail from './TemporaryEmail';
import ReceivedEmail from './ReceivedEmail';
import EmailAttachment from './EmailAttachment';

// Define associations

// Domain -> TemporaryEmail (One-to-Many)
Domain.hasMany(TemporaryEmail, {
  foreignKey: 'domain',
  sourceKey: 'domain',
  as: 'temporaryEmails',
});

TemporaryEmail.belongsTo(Domain, {
  foreignKey: 'domain',
  targetKey: 'domain',
  as: 'domainInfo',
});

// TemporaryEmail -> ReceivedEmail (One-to-Many)
TemporaryEmail.hasMany(ReceivedEmail, {
  foreignKey: 'temporaryEmailId',
  as: 'receivedEmails',
  onDelete: 'CASCADE',
});

ReceivedEmail.belongsTo(TemporaryEmail, {
  foreignKey: 'temporaryEmailId',
  as: 'temporaryEmail',
});

// ReceivedEmail -> EmailAttachment (One-to-Many)
ReceivedEmail.hasMany(EmailAttachment, {
  foreignKey: 'emailId',
  as: 'emailAttachments',
  onDelete: 'CASCADE',
});

EmailAttachment.belongsTo(ReceivedEmail, {
  foreignKey: 'emailId',
  as: 'email',
});

export {
  Domain,
  TemporaryEmail,
  ReceivedEmail,
  EmailAttachment,
};