//@ts-ignore
window.__react_router_build__ = undefined;

const rrds = jest.requireActual('react-router-dom');
console.log('ARRRRRRRRRRR', Object.keys(rrds));

module.exports = {
  __esModule: true,
  ...rrds,
};
