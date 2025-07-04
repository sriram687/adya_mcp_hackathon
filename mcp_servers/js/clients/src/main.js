"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var express_1 = require("express");
var cors_1 = require("cors");
var morgan_1 = require("morgan");
var server_connection_js_1 = require("./server_connection.js");
var client_and_server_validation_js_1 = require("./client_and_server_validation.js");
var client_and_server_execution_js_1 = require("./client_and_server_execution.js");
// Initialize Express app
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
function customLogger(tokens, req, res) {
    var date = new Date().toISOString(); // Current timestamp
    var method = tokens.method(req, res); // HTTP method
    var url = tokens.url(req, res); // URL requested
    var httpVersion = "HTTP/" + req.httpVersion; // HTTP version
    var statusCode = res.statusCode; // HTTP status code
    // Construct custom log message
    return "date: ".concat(date, ", ").concat(method, " ").concat(url, " ").concat(httpVersion, " ").concat(statusCode);
}
app.use((0, morgan_1.default)(customLogger));
app.get('/', function (req, res) {
    res.send({ message: 'Javascript McpClient Working fine....' });
});
// Non-streaming API endpoint
app.post('/api/v1/mcp/process_message', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, validation_result, generated_payload, executionResponse, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                console.log("⏳ Steps : Process Started ✅...");
                data = __assign({}, req.body);
                data.client_details["is_stream"] = false;
                return [4 /*yield*/, (0, client_and_server_validation_js_1.ClientAndServerValidation)(data, { streamCallbacks: null, is_stream: false })];
            case 1:
                validation_result = _a.sent();
                if (!validation_result.status) {
                    console.log("⏳ Steps :  Client & Server Validation Failed ❌...");
                    console.log("⏳ Steps : Process Failed ❌...");
                    return [2 /*return*/, res.status(200).json({
                            Data: null,
                            Error: validation_result.error,
                            Status: false,
                        })];
                }
                console.log("⏳ Steps : Client & Server Validated successfully✅...");
                generated_payload = validation_result.payload;
                return [4 /*yield*/, (0, client_and_server_execution_js_1.ClientAndServerExecution)(generated_payload, { streamCallbacks: null, is_stream: false })];
            case 2:
                executionResponse = _a.sent();
                // =========================================== execution start ====================================================================
                console.log("⏳ Steps : Client & Server Executed successful✅...");
                console.log("⏳ Steps : Process Completed ✅...");
                res.status(200).json(executionResponse);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.log("Error ========>>>>> ", error_1);
                console.log("⏳ Steps : Process Failed ❌...");
                res.status(500).json({
                    Data: null,
                    Error: error_1 instanceof Error ? error_1.message : 'An unexpected error occurred',
                    Status: false,
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.post('/api/v1/mcp/process_message_stream', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var customStreamHandler, data, validation_result, generated_payload, executionResponse, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                customStreamHandler = {
                    onData: function (chunk) {
                        res.write("data: ".concat(chunk, "\n\n"));
                    },
                    onEnd: function () {
                        res.write("data: ".concat(JSON.stringify({
                            Data: null,
                            Error: null,
                            Status: true,
                            StreamingStatus: "COMPLETED",
                            Action: "NO-ACTION"
                        }), "\n\n"));
                        res.end();
                    },
                    onError: function (error) {
                        console.log("Streaming Error:", error);
                        res.write("data: ".concat(JSON.stringify({ error: error.message }), "\n\n"));
                        res.end();
                    }
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                data = __assign({}, req.body);
                data.client_details["is_stream"] = false;
                // Set headers for streaming
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                customStreamHandler.onData(JSON.stringify({
                    Data: null,
                    Error: null,
                    Status: true,
                    StreamingStatus: "STARTED",
                    Action: "NO-ACTION"
                }));
                return [4 /*yield*/, (0, client_and_server_validation_js_1.ClientAndServerValidation)(data, { streamCallbacks: customStreamHandler, is_stream: true })];
            case 2:
                validation_result = _a.sent();
                if (!validation_result.status) {
                    customStreamHandler.onData(JSON.stringify({
                        Data: null,
                        Error: validation_result.error,
                        Status: false,
                        StreamingStatus: "ERROR",
                        Action: "ERROR"
                    }));
                    customStreamHandler.onEnd();
                    return [2 /*return*/];
                }
                generated_payload = validation_result.payload;
                return [4 /*yield*/, (0, client_and_server_execution_js_1.ClientAndServerExecution)(generated_payload, { streamCallbacks: customStreamHandler, is_stream: true })];
            case 3:
                executionResponse = _a.sent();
                // =========================================== execution start ====================================================================
                if (!executionResponse.Status) {
                    customStreamHandler.onData(JSON.stringify({
                        Data: executionResponse.Data,
                        Error: executionResponse.Error,
                        Status: false,
                        StreamingStatus: "ERROR",
                        Action: "ERROR"
                    }));
                    customStreamHandler.onEnd();
                    return [2 /*return*/];
                }
                customStreamHandler.onData(JSON.stringify({
                    Data: executionResponse.Data,
                    Error: executionResponse.Error,
                    Status: executionResponse.Status,
                    StreamingStatus: "IN-PROGRESS",
                    Action: "AI-RESPONSE"
                }));
                customStreamHandler.onEnd();
                return [3 /*break*/, 5];
            case 4:
                error_2 = _a.sent();
                console.log("Error ========>>>>> ", error_2);
                customStreamHandler.onData(JSON.stringify({
                    Data: null,
                    Error: error_2,
                    Status: false,
                    StreamingStatus: "ERROR",
                    Action: "ERROR"
                }));
                customStreamHandler.onEnd();
                return [2 /*return*/];
            case 5: return [2 /*return*/];
        }
    });
}); });
console.log("Current working directory:", process.cwd());
// Start the server
var PORT = 5050;
app.listen(PORT, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, server_connection_js_1.initializeAlllMCP)()];
            case 1:
                _a.sent();
                console.log("╔═══════════════════════════════════════════════════════════════════════════════════════════╗");
                console.log("║                                                                                           ║");
                console.log("║                                📈🚀✨ ADYA  📈🚀✨                                        ║");
                console.log("║                                                                                           ║");
                console.log("║  🎉 Welcome to the MCP(Model Context Protocol) Server Integration Hackathon 2k25 !! 🎉    ║");
                console.log("║                                                                                           ║");
                console.log("║  ✅ Server running on http://localhost:5050 ✅                                            ║");
                console.log("║                                                                                           ║");
                console.log("╚═══════════════════════════════════════════════════════════════════════════════════════════╝");
                return [2 /*return*/];
        }
    });
}); });
