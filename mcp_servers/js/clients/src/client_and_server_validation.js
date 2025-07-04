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
exports.ClientAndServerValidation = ClientAndServerValidation;
var server_connection_js_1 = require("./server_connection.js");
var client_and_server_config_js_1 = require("./client_and_server_config.js");
function ClientAndServerValidation(payload, streaming_callback) {
    return __awaiter(this, void 0, void 0, function () {
        var selected_server_credentials, client_details, selected_client, selected_servers, _i, selected_servers_1, server, tools_arr, _a, selected_servers_2, server, resource, _b, _c, tool, err_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 5, , 6]);
                    selected_server_credentials = payload === null || payload === void 0 ? void 0 : payload.selected_server_credentials;
                    client_details = payload === null || payload === void 0 ? void 0 : payload.client_details;
                    selected_client = (payload === null || payload === void 0 ? void 0 : payload.selected_client) || "";
                    selected_servers = (payload === null || payload === void 0 ? void 0 : payload.selected_servers) || [];
                    if (selected_client == "" || selected_servers.length == 0 || !selected_server_credentials || !client_details) {
                        console.log("Invalid Request Payload");
                        return [2 /*return*/, {
                                "payload": null,
                                "error": "Invalid Request Payload",
                                "status": false
                            }];
                    }
                    for (_i = 0, selected_servers_1 = selected_servers; _i < selected_servers_1.length; _i++) {
                        server = selected_servers_1[_i];
                        if (!server_connection_js_1.MCPServers[server]) {
                            console.log("Invalid Server");
                            return [2 /*return*/, {
                                    "payload": null,
                                    "error": "Invalid Server",
                                    "status": false
                                }];
                        }
                    }
                    if (!client_and_server_config_js_1.ClientsConfig.includes(selected_client)) {
                        console.log("Invalid Client");
                        return [2 /*return*/, {
                                "payload": null,
                                "error": "Invalid Client",
                                "status": false
                            }];
                    }
                    tools_arr = [];
                    _a = 0, selected_servers_2 = selected_servers;
                    _d.label = 1;
                case 1:
                    if (!(_a < selected_servers_2.length)) return [3 /*break*/, 4];
                    server = selected_servers_2[_a];
                    if (!server_connection_js_1.MCPServers[server]) return [3 /*break*/, 3];
                    return [4 /*yield*/, server_connection_js_1.MCPServers[server].listTools()];
                case 2:
                    resource = _d.sent();
                    for (_b = 0, _c = resource.tools; _b < _c.length; _b++) {
                        tool = _c[_b];
                        tools_arr.push({
                            type: "function",
                            function: {
                                name: tool.name,
                                description: tool.description || "Tool for ".concat(tool.name),
                                parameters: tool.inputSchema || {
                                    type: "object",
                                    properties: {},
                                    required: []
                                }
                            }
                        });
                    }
                    _d.label = 3;
                case 3:
                    _a++;
                    return [3 /*break*/, 1];
                case 4:
                    client_details["tools"] = tools_arr;
                    return [2 /*return*/, {
                            "payload": {
                                "selected_client": selected_client,
                                "selected_servers": selected_servers,
                                "selected_server_credentials": selected_server_credentials,
                                "client_details": client_details
                            },
                            "error": null,
                            "status": true
                        }];
                case 5:
                    err_1 = _d.sent();
                    console.log("Error initializing MCP ==========>>>> ", err_1);
                    return [2 /*return*/, {
                            "payload": null,
                            "error": err_1,
                            "status": false
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
