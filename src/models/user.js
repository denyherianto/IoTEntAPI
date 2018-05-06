module.exports = (sequelize, Sequelize) => {
  return sequelize.define('user', {
    // username: Sequelize.STRING,
    email: { type: Sequelize.STRING, allowNull: false, unique: 'compositeIndex' },
    name: { type: Sequelize.STRING, allowNull: false },
    // password: { type: Sequelize.STRING, allowNull: true },
    // birthday: Sequelize.DATE
    google_id: { type: Sequelize.STRING, allowNull: false },
    key_api:  { type: Sequelize.STRING, allowNull: true },
    key_expired:  { type: Sequelize.DATE, allowNull: true },
  })
}
