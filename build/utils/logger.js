"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.info = exports.warning = exports.error = exports.critical = void 0;
const critical = (...params) => {
    // rollbar.critical(...params);
    console.error(...params);
};
exports.critical = critical;
const error = (...params) => {
    // rollbar.error(...params);
    console.error(...params);
};
exports.error = error;
const warning = (...params) => {
    // rollbar.warning(...params);
    console.error(...params);
};
exports.warning = warning;
const info = (...params) => {
    console.log(...params);
};
exports.info = info;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdXRpbHMvbG9nZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFPLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsRUFBRTtJQUNwQywrQkFBK0I7SUFDL0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQztBQUhXLFFBQUEsUUFBUSxZQUduQjtBQUNLLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsRUFBRTtJQUNqQyw0QkFBNEI7SUFDNUIsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQztBQUhXLFFBQUEsS0FBSyxTQUdoQjtBQUVLLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsRUFBRTtJQUNuQyw4QkFBOEI7SUFDOUIsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQztBQUhXLFFBQUEsT0FBTyxXQUdsQjtBQUNLLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxNQUFNLEVBQUUsRUFBRTtJQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDO0FBRlcsUUFBQSxJQUFJLFFBRWYifQ==