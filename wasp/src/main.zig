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

pub fn assertNonNull(pointer: ?*const void, name: []const u8) void {
    std.debug.assert(pointer != null, "{s} is null!", .{name});
}

pub fn applySpringForce(
    maybe_a: ?*Point,
    maybe_b: ?*Point,
    restLength: f32,
    springConstant: f32,
) void {
    if (maybe_a == null) {
        @panic("a is null");
    }
    if (maybe_b == null) {
        @panic("b is null");
    }
    const a = maybe_a orelse unreachable;
    const b = maybe_b orelse unreachable;

    const distance = a.pos.subtract(b.pos);
    if (std.math.isNan(a.pos.x)) {
        @panic("x is Nan");
    }
    if (distance.length() < restLength) {
        return;
    }
    // Calculate the current length of the spring
    const stretch: f32 = distance.length() - restLength;

    // Get the normalized direction vector
    const normalizedDis = distance.normalize();

    // Calculate the magnitude of the spring force
    const forceMagnitude: f32 = springConstant * stretch;

    // Scale the normalized direction vector by the force magnitude
    const scale = if (forceMagnitude < 10_000) forceMagnitude else 10_000;
    const springForce = normalizedDis.scale(scale);
    log("spring force {} mag {} distance {} A {} B {}", .{ springForce, forceMagnitude, distance, a.pos, b.pos });
    // Apply the spring force to the points
    b.acc = b.acc.add(springForce);
    a.acc = a.acc.add(springForce.invert()); // Apply opposite force to a
}

const Point = struct {
    pos: Vector3,
    vel: Vector3,
    acc: Vector3,
    locked: bool = false,
    updated: bool = false,
    fn init(pos: Vector3) Point {
        const vel: Vector3 = .{ .x = 0.00, .y = 0, .z = 0 };
        const acc: Vector3 = .{ .x = 0, .y = 0, .z = 0 };
        return .{
            .pos = pos,
            .vel = vel,
            .acc = acc,
        };
    }
    pub fn applyForce(self: *Point, force: Vector3) void {
        if (!self.locked) {
            log("adding acc {} to {}", .{ self.acc, force });
            self.acc = rlm.vector3Add(self.acc, force);
        }
    }
    fn update(self: *Point) void {
        const DRAG = 0.015;

        self.vel = rlm.vector3Scale(self.vel, 1.0 - DRAG);
        self.pos = rlm.vector3Add(self.pos, self.vel);
        self.acc = rlm.vector3ClampValue(self.acc, 0, 100);
    }
    pub fn draw(self: *Point) void {
        const x: i32 = @intFromFloat(self.pos.x);
        _ = x; // autofix
        const y: i32 = @intFromFloat(self.pos.y);
        _ = y; // autofix
        //ray.drawCircle(x, y, 1, ray.Color.black);
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
    pointA: usize,
    pointB: usize,
    fn init(pointA: usize, pointB: usize) Edge {
        return .{ .pointA = pointA, .pointB = pointB };
    }
    pub fn update(self: *Edge, edgeFN: EdgeUpdateFn, pointFn: PointUpdateFn, points: std.ArrayList(Point)) !void {
        _ = pointFn; // autofix
        _ = edgeFN; // autofix
        const pointA = &points.items[self.pointA];
        const pointB = &points.items[self.pointB];
        log("pointA {} pos {}", .{ pointA, pointA.pos.x });
        log("pointB {} pos {}", .{ pointB, pointA.pos.x });
        const edgeRestLength: f32 = 20;
        _ = edgeRestLength; // autofix
        const springConstant: f32 = 0.37;
        _ = springConstant; // autofix
        pointA.pos = pointA.pos.add(.{ .x = 1, .y = 0, .z = 0 });

        log("pointA {} pos {}", .{ pointA, pointA.pos.x });
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

const gravity: Vector3 = .{ .x = 0.01, .y = 0, .z = 0 };
const wind: Vector3 = .{ .x = 0, .y = 0.01, .z = 0 };
const Sheet = struct {
    allocator: Allocator,
    points: std.ArrayList(Point),
    edges: std.ArrayList(Edge),
    pub fn init(allocator: Allocator, cols: u32, rows: u32) !*Sheet {
        const spacing = 20;
        var points = std.ArrayList(Point).init(allocator);
        var edges = std.ArrayList(Edge).init(allocator);
        var i: u32 = 0;
        // MARK: Setup
        for (0..rows) |row| {
            for (0..cols) |col| {
                defer {
                    i += 1;
                }

                const x: f32 = @floatFromInt((col + 10) * spacing);
                const y: f32 = @floatFromInt(row * spacing);
                var point = Point.init(.{ .x = x, .y = y, .z = 0 });
                log("point  x {d:.2} y {d:.2}", .{ x, y });

                // Lock corner points
                if (row == 0 and (col == 0 or col == cols - 1)) {
                    point.vel = Vector3.init(0, 0, 0);
                    point.locked = true;
                }

                try points.append(point);
                const pointIndex = points.items.len - 1;

                // Connect to the point to the left
                if (col > 0) {
                    const leftIndex = pointIndex - 1;
                    try edges.append(Edge.init(leftIndex, pointIndex));
                }

                // Connect to the point above
                if (row > 0) {
                    const aboveIndex = (row - 1) * cols + col;
                    try edges.append(Edge.init(aboveIndex, pointIndex));

                    // Connect to the top-left diagonal point
                    if (col > 0) {
                        const topLeftIndex = (row - 1) * cols + (col - 1);
                        var edge = Edge.init(topLeftIndex, pointIndex);
                        edge.restLength = std.math.sqrt(edge.restLength * edge.restLength +
                            edge.restLength * edge.restLength);
                        try edges.append(edge);
                    }

                    // Connect to the top-right diagonal point
                    if (col < (cols - 1)) {
                        const topRightIndex = (row - 1) * cols + (col + 1);
                        var edge = Edge.init(topRightIndex, pointIndex);
                        edge.restLength = std.math.sqrt(edge.restLength * edge.restLength +
                            edge.restLength * edge.restLength);
                        try edges.append(edge);
                    }
                }
            }
        }

        const sheet = try allocator.create(Sheet);
        sheet.* = .{ .allocator = allocator, .points = points, .edges = edges };
        log("init point {} edges {}", .{ points.items.len, edges.items.len });
        return sheet;
    }
    pub fn deint(self: *Sheet) void {
        self.points.deinit();
        self.edges.deinit();
    }
    pub fn update(self: *Sheet) !void {
        const DRAG = 0.015;
        _ = DRAG; // autofix

        for (self.edges.items) |*edge| {
            const pointA = &self.points.items[edge.pointA];
            const pointB = &self.points.items[edge.pointB];
            const edgeRestLength: f32 = 20;
            const springConstant: f32 = 0.37;
            applySpringForce(pointA, pointB, edgeRestLength, springConstant);
            if (!pointA.updated) {
                if (!pointA.locked) {
                    log("adding acc {} to {}", .{ pointA.acc, gravity });
                    pointA.acc = pointA.acc.add(gravity);
                    pointA.acc = pointA.acc.add(wind);
                }
                pointA.vel = pointA.vel.add(pointA.acc);
                pointA.pos = pointA.pos.add(pointA.vel);

                pointA.updated = true;
            }
        }
    }
    pub fn getPoints(self: *Sheet, edge: Edge) struct { Point, Point } {
        const aIdx = edge.pointA;
        const bIdx = edge.pointB;
        const a = self.points.items[aIdx];
        const b = self.points.items[bIdx];
        return .{ a, b };
    }

    pub fn draw(self: *Sheet) void {
        for (self.edges.items) |edge| {
            const pointA, const pointB = self.getPoints(edge);
            const pointAx: i32 = @intFromFloat(pointA.pos.x);
            const pointAy: i32 = @intFromFloat(pointA.pos.y);
            const pointBx: i32 = @intFromFloat(pointB.pos.x);
            const pointBy: i32 = @intFromFloat(pointB.pos.y);

            ray.drawLine(pointAx, pointAy, pointBx, pointBy, ray.Color.black);
        }
        for (self.points.items) |*point| {
            point.draw();
        }
    }

    // Named function for updating edges
    pub fn updateEdge(a: *Point, b: *Point) void {
        const edgeRestLength: f32 = 20;
        const springConstant: f32 = 0.37;
        applySpringForce(a, b, edgeRestLength, springConstant);
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
        const sheet = try Sheet.init(allocator, cols, rows);
        return .{ .allocator = allocator, .sheet = sheet, .cols = cols, .rows = rows };
    }

    pub fn deinit(self: *State) void {
        Sheet.deint(self.sheet);
        self.allocator.destroy(self.sheet);
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
    // MARK: Main
    var state: State = try State.init(allocator, 30, 20);
    defer state.deinit();
    const c = ray.Color;
    const colors = [_]ray.Color{ c.green, c.red, c.gray, c.white, c.violet };
    const colors_len: i32 = @intCast(colors.len);
    var current_color: i32 = 2;

    while (!ray.windowShouldClose()) {
        // input
        if (ray.isKeyPressed(.q)) {
            break;
        }
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

            state.sheet.draw();

            // now lets use an allocator to create some dynamic text
            // pay attention to the Z in `allocPrintZ` that is a convention
            // for functions that return zero terminated strings
            const seconds: u32 = @intFromFloat(ray.getTime());
            const dynamic = try std.fmt.allocPrintZ(allocator, "running since {d} seconds", .{seconds});
            defer allocator.free(dynamic);
            ray.drawText(dynamic, 300, 250, 20, ray.Color.white);

            ray.drawFPS(width - 100, 10);
            ray.clearBackground(colors[@intCast(current_color)]);
        }
    }
}
fn toVector2(vec: Vector3) ray.Vector2 {
    return .{ .x = vec.x, .y = vec.y };
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
