"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServers = void 0;
exports.initializeAlllMCP = initializeAlllMCP;
var index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
var client_and_server_config_js_1 = require("./client_and_server_config.js");
exports.MCPServers = {};
function initializeAlllMCP() {
    return __awaiter(this, void 0, void 0, function () {
        var title, header, boxWidth_1, createLine, createTextLine_1, _loop_1, _i, ServersConfig_1, server, err_1, boxWidth;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    title = "MCP Servers and Available Tools";
                    header = "Server Name      │      Available Tools";
                    boxWidth_1 = Math.max(title.length + 8, header.length + 4);
                    createLine = function (char) { return char + "─".repeat(boxWidth_1 - 2) + char; };
                    createTextLine_1 = function (text) { return "│" + text.padEnd(boxWidth_1 - 2) + "│"; };
                    console.log("\n" + createLine("┌") + "┐");
                    console.log(createTextLine_1("     " + title + "     "));
                    console.log(createLine("├") + "┤");
                    console.log(createTextLine_1(" " + header + " "));
                    console.log(createLine("├") + "┤");
                    _loop_1 = function () {
                        var newClient_1, transport, resources, tools_arr, statusMsg, err_2, errorMsg;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    newClient_1 = new index_js_1.Client({
                                        name: "".concat(server.server_name, "_CLIENT"),
                                        version: "1.0.0"
                                    });
                                    transport = new stdio_js_1.StdioClientTransport({
                                        command: "node",
                                        args: ["".concat(process.cwd(), "/../servers/").concat(server.server_name, "/").concat(server.path)]
                                    });
                                    return [4 /*yield*/, newClient_1.connect(transport).then(function () {
                                            exports.MCPServers[server.server_name] = newClient_1;
                                        }).catch(function (err) {
                                            var errorMsg = " ".concat(server.server_name.padEnd(15), "\u2502 Connection Error: ").concat(err);
                                            console.log(createTextLine_1(errorMsg));
                                        })];
                                case 1:
                                    _b.sent();
                                    return [4 /*yield*/, newClient_1.listTools()];
                                case 2:
                                    resources = _b.sent();
                                    tools_arr = resources.tools.map(function (resource) { return resource.name; });
                                    statusMsg = " ".concat(server.server_name.padEnd(15), "\u2502 ").concat("".concat(tools_arr.length, " tools").padEnd(20));
                                    console.log(createTextLine_1(statusMsg));
                                    return [3 /*break*/, 4];
                                case 3:
                                    err_2 = _b.sent();
                                    errorMsg = " ".concat(server.server_name.padEnd(15), "\u2502 Init Error: ").concat(err_2);
                                    console.log(createTextLine_1(errorMsg));
                                    return [2 /*return*/, "continue"];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, ServersConfig_1 = client_and_server_config_js_1.ServersConfig;
                    _a.label = 1;
                case 1:
                    if (!(_i < ServersConfig_1.length)) return [3 /*break*/, 4];
                    server = ServersConfig_1[_i];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log(createLine("└") + "┘\n");
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    boxWidth = "".concat(err_1).length + 35;
                    console.log("┌" + "─".repeat(boxWidth - 2) + "┐");
                    console.log("│ Error initializing MCP server:".padEnd(boxWidth - 1) + "│");
                    console.log("│ " + "".concat(err_1).padEnd(boxWidth - 3) + "│");
                    console.log("└" + "─".repeat(boxWidth - 2) + "┘");
                    return [2 /*return*/, false];
                case 6: return [2 /*return*/];
            }
        });
    });
}
