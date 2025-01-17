const ray = @import("raylib");
const std = @import("std");
const rlm = ray.math;
const Allocator = std.mem.Allocator;
const Vector3 = ray.Vector3;
const damping = 0.99;
const log = std.log.debug;

pub fn main() !void {
    try ray_main();
    try hints();
}
pub fn applySpringForce(
    a: *Point,
    b: *Point,
    restLength: f32,
    springConstant: f32,
) void {
    const distance = a.pos.subtract(b.pos);

    // Calculate the current length of the spring
    const stretch: f32 = distance.length() - restLength;

    // Get the normalized direction vector
    const normalizedDis = distance.normalize();

    // Calculate the magnitude of the spring force
    const forceMagnitude: f32 = springConstant * stretch;

    // Scale the normalized direction vector by the force magnitude
    const scale = if (forceMagnitude < 10_000) forceMagnitude else 10_000;
    const springForce = normalizedDis.scale(scale);

    // Apply the spring force to the points
    b.applyForce(springForce);
    a.applyForce(springForce.invert()); // Apply opposite force to a
}

const Point = struct {
    pos: Vector3,
    vel: Vector3,
    acc: Vector3,
    locked: bool = false,
    updated: bool = false,
    fn init(pos: Vector3) Point {
        const vel: Vector3 = .{ .x = 0.01, .y = 0, .z = 0 };
        const acc: Vector3 = .{ .x = 0, .y = 0, .z = 0 };
        return .{
            .pos = pos,
            .vel = vel,
            .acc = acc,
        };
    }
    pub fn applyForce(self: *Point, force: Vector3) void {
        if (!self.locked) {
            self.acc = rlm.vector3Add(self.acc, force);
        }
    }
    fn update(self: *Point) void {
        self.acc = rlm.vector3Add(self.acc, self.vel);
        self.pos = rlm.vector3Add(self.pos, self.vel);
        self.acc = Vector3.init(0, 0, 0);
    }
    pub fn draw(self: *Point) void {
        ray.drawCircle(self.pos.x, self.pos.y, 10, ray.Color.black);
        self.updated = false;
    }

    pub fn selfLog(self: *Point) void {
        const pos = self.pos;
        const vel = self.vel;
        const acc = self.acc;

        log("Vector3: ({}, {}, {})\n", .{ pos.x, pos.y, pos.z });
        log("Vector3: ({}, {}, {})\n", .{ vel.x, vel.y, vel.z });
        log("Vector3: ({}, {}, {})\n", .{ acc.x, acc.y, acc.z });
    }
};
const EdgeUpdateFn = *const fn (a: *Point, b: *Point) void;
const PointUpdateFn = *const fn (c: *Point) void;
const Edge = struct {
    restLength: u32 = 20,
    pointA: *Point,
    pointB: *Point,
    fn init(pointA: *Point, pointB: *Point) Edge {
        return .{ .pointA = pointA, .pointB = pointB };
    }
    pub fn update(self: *Edge, edgeFN: EdgeUpdateFn, pointFn: PointUpdateFn) !void {
        edgeFN(self.pointA, self.pointB);
        if (!self.pointA.updated) {
            pointFn(self.pointA);
            self.pointA.update();
            self.pointA.updated = true;
        }
        if (!self.pointB.updated) {
            pointFn(self.pointB);
            self.pointB.update();
            self.pointB.updated = true;
        }
    }
    pub fn draw(self: Edge) !void {
        const a = self.pointA.pos;
        const b = self.pointB.pos;
        ray.drawLine(a.x, a.y, b.x, b.y, ray.Color.blue);
    }
    pub fn logSelf(self: *Edge) void {
        const stdout = std.io.getStdOut().writer();
        _ = stdout; // autofix
        log("Edge:\n  Rest Length: {}\n", .{self.restLength});

        // Log details of pointA and pointB
        self.pointA.selfLog();
        self.pointB.selfLog();
    }
};

const gravity: Vector3 = Vector3.init(0, 0.05, 0);
const wind: Vector3 = Vector3.init(0, 0.05, 0);
const Sheet = struct {
    allocator: Allocator,
    points: []Point,
    edges: std.ArrayList(Edge),
    pub fn init(allocator: Allocator, cols: u32, rows: u32) !Sheet {
        const spacing = 20;
        const points = try allocator.alloc(Point, (cols * rows) + 1);
        var edges = std.ArrayList(Edge).init(allocator);
        var i: u32 = 0;
        for (0..rows) |row| {
            const len = points.len;
            _ = len; // autofix
            for (0..cols) |col| {
                defer {
                    i += 1;
                }
                const x: f32 = @floatFromInt(row * spacing);
                const y: f32 = @floatFromInt(row * spacing);
                var point = Point.init(.{ .x = x, .y = y, .z = 0 });

                if (row == 0 and (col == 0 or col == rows - 1)) {
                    point.vel = Vector3.init(0, 0, 0);
                    point.locked = true;
                }

                points[i] = point;

                // Connect to the point to the left
                if (col > 0) {
                    var leftPoint = points[points.len - 2];
                    const edge = Edge.init(&point, &leftPoint);
                    try edges.append(edge);
                }

                // Connect to the point above
                if (row > 0) {
                    const localIndex = (row - 1) * cols + row;
                    var abovePoint = points[localIndex];
                    try edges.append(Edge.init(&point, &abovePoint));

                    // Connect to the top-left diagonal point
                    if (col > 0) {
                        var topLeftPoint = points[(row - 1) * cols + (col - 1)];
                        var edge = Edge.init(&point, &topLeftPoint);
                        edge.restLength = std.math.sqrt(edge.restLength * edge.restLength +
                            edge.restLength * edge.restLength);
                        try edges.append(edge);
                    }

                    // Connect to the top-right diagonal point
                    if (col < (cols - 1)) {
                        var topRightPoint = points[(row - 1) * cols + (col + 1)];
                        var edge = Edge.init(&point, &topRightPoint);
                        edge.restLength = std.math.sqrt(edge.restLength * edge.restLength +
                            edge.restLength * edge.restLength);
                        try edges.append(edge);
                    }
                }
            }
        }

        return .{ .allocator = allocator, .points = points, .edges = edges };
    }
    pub fn deint(self: *Sheet) void {
        self.allocator.free(self.points);
        self.edges.deinit();
    }
    pub fn update(self: *Sheet) !void {
        for (self.edges.items) |*edge| {
            try edge.update(Sheet.updateEdge, Sheet.updatePoint);
        }
    }

    pub fn draw(self: Sheet) void {
        for (self.edges.items) |*edge| {
            const d = edge.pointA;
            _ = d; // autofix
            edge.logSelf();
            const pointA = edge.pointA.pos;
            const pointB = edge.pointB.pos;
            const a: ray.Vector2 = .{ .x = pointA.x, .y = pointA.y };
            const b: ray.Vector2 = .{ .x = pointB.x, .y = pointB.y };
            ray.drawLineV(a, b, ray.Color.black);
        }
    }

    // Named function for updating edges
    pub fn updateEdge(a: *Point, b: *Point) void {
        const edgeRestLength: f32 = 20;
        const springConstant: f32 = 0.37;
        applySpringForce(a, b, edgeRestLength, springConstant);
    }

    // Named function for updating points
    pub fn updatePoint(point: *Point) void {
        point.applyForce(gravity);
        point.applyForce(wind);
    }

    fn calculateConnections(rows: u32, cols: u32) u32 {
        return rows * (cols - 1) + cols * (rows - 1) + 2(*rows - 1) * (cols - 1);
    }
};
const State = struct {
    allocator: Allocator,
    sheet: *Sheet,
    cols: u32,
    rows: u32,

    fn init(allocator: Allocator, cols: u32, rows: u32) !State {
        var sheet = try Sheet.init(allocator, cols, rows);
        return .{ .allocator = allocator, .sheet = &sheet, .cols = cols, .rows = rows };
    }

    pub fn deinit(self: *State) void {
        Sheet.deint(self.sheet);
    }
};

fn ray_main() !void {
    // const monitor = ray.GetCurrentMonitor();
    // const width = ray.GetMonitorWidth(monitor);
    // const height = ray.GetMonitorHeight(monitor);
    const width = 800;
    const height = 500;

    ray.setConfigFlags(.{ .msaa_4x_hint = true });
    ray.initWindow(width, height, "Flag simulator");
    defer ray.closeWindow();

    var gpa = std.heap.GeneralPurposeAllocator(.{ .stack_trace_frames = 8 }){};
    const allocator = gpa.allocator();
    defer {
        switch (gpa.deinit()) {
            .leak => @panic("leaked memory"),
            else => {},
        }
    }
    var state: State = try State.init(allocator, 30, 20);
    defer state.deinit();
    const c = ray.Color;
    const colors = [_]ray.Color{ c.green, c.red, c.gray, c.white, c.violet };
    const colors_len: i32 = @intCast(colors.len);
    var current_color: i32 = 2;

    while (!ray.windowShouldClose()) {
        // input
        var delta: i2 = 0;
        if (ray.isKeyPressed(ray.KeyboardKey.up)) delta += 1;
        if (ray.isKeyPressed(ray.KeyboardKey.down)) delta -= 1;
        if (delta != 0) {
            current_color = @mod(current_color + delta, colors_len);
        }
        {
            // update
            try state.sheet.update();
        }

        // draw
        {
            ray.beginDrawing();
            defer ray.endDrawing();

            ray.clearBackground(colors[@intCast(current_color)]);
            state.sheet.draw();

            // now lets use an allocator to create some dynamic text
            // pay attention to the Z in `allocPrintZ` that is a convention
            // for functions that return zero terminated strings
            const seconds: u32 = @intFromFloat(ray.getTime());
            const dynamic = try std.fmt.allocPrintZ(allocator, "running since {d} seconds", .{seconds});
            defer allocator.free(dynamic);
            ray.drawText(dynamic, 300, 250, 20, ray.Color.white);

            ray.drawFPS(width - 100, 10);
        }
    }
}

fn hints() !void {
    const stdout_file = std.io.getStdOut().writer();
    var bw = std.io.bufferedWriter(stdout_file);
    const stdout = bw.writer();

    try stdout.print("\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n", .{});
    try stdout.print("Here are some hints:\n", .{});
    try stdout.print("Run `zig build --help` to see all the options\n", .{});
    try stdout.print("Run `zig build -Doptimize=ReleaseSmall` for a small release build\n", .{});
    try stdout.print("Run `zig build -Doptimize=ReleaseSmall -Dstrip=true` for a smaller release build, that strips symbols\n", .{});
    try stdout.print("Run `zig build -Draylib-optimize=ReleaseFast` for a debug build of your application, that uses a fast release of raylib (if you are only debugging your code)\n", .{});

    try bw.flush(); // don't forget to flush!
}

test "simple test" {
    var list = std.ArrayList(i32).init(std.testing.allocator);
    defer list.deinit(); // try commenting this out and see if zig detects the memory leak!
    try list.append(42);
    try std.testing.expectEqual(@as(i32, 42), list.pop());
}
