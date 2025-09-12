import { Router } from "express";
import { PrismaClient, ConnKind } from "@prisma/client";
import { z } from "zod";
import { connectionManager } from "../services/connectionManager";
import { authMiddleware } from "../auth/jwt";
import { sheetDiscoveryService } from "../services/sheetDiscovery";

const prisma = new PrismaClient();
const router = Router();

const createConn = z.object({
	kind: z.nativeEnum(ConnKind),
	displayName: z.string().min(1),
	encUri: z.string().min(1),
	encMeta: z.string().min(1),
	readOnly: z.boolean().default(true)
});

const createConnFromForm = z.object({
	name: z.string().min(1),
	kind: z.nativeEnum(ConnKind),
	host: z.string().optional(),
	port: z.string().optional(),
	database: z.string().optional(),
	username: z.string().optional(),
	password: z.string().optional(),
	uri: z.string().optional(),
	readOnly: z.boolean().default(true)
});

// GET /connections - List all connections for tenant
router.get("/", async (req: any, res) => {
	try {
		const connections = await prisma.connection.findMany({
			where: { tenantId: req.user.tenantId },
			select: {
				id: true,
				kind: true,
				displayName: true,
				readOnly: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		
		// Transform to match frontend interface
		const transformedConnections = connections.map((conn) => ({
			id: conn.id,
			name: conn.displayName,
			kind: conn.kind,
			displayName: conn.displayName,
			readOnly: conn.readOnly,
			status: 'connected' as const,
			createdAt: conn.createdAt.toISOString(),
			lastConnected: conn.updatedAt.toISOString()
		}));
		
		res.json(transformedConnections);
	} catch (error) {
		console.error('Failed to fetch connections:', error);
		res.status(500).json({ error: "Failed to fetch connections" });
	}
});

// Create connection from encrypted data
router.post("/", async (req: any, res, next) => {
	try {
		const body = createConn.parse(req.body);
		const conn = await prisma.connection.create({
			data: {
				tenantId: req.user.tenantId,
				kind: body.kind,
				displayName: body.displayName,
				encUri: body.encUri,
				encMeta: body.encMeta,
				readOnly: body.readOnly
			}
		});
		res.json(conn);
	} catch (e) { next(e); }
});

// Create connection from form data
router.post("/create", async (req: any, res, next) => {
	try {
		const body = createConnFromForm.parse(req.body);
		
		// Build connection URI based on database type
		let uri = '';
		let meta = '';
		
		if (body.uri) {
			uri = body.uri;
		} else {
			switch (body.kind) {
				case 'POSTGRES':
					uri = `postgresql://${body.username}:${body.password}@${body.host}:${body.port}/${body.database}`;
					break;
				case 'MYSQL':
					uri = `mysql://${body.username}:${body.password}@${body.host}:${body.port}/${body.database}`;
					break;
				case 'MONGODB':
					uri = `mongodb://${body.username}:${body.password}@${body.host}:${body.port}/${body.database}`;
					break;
				case 'EXCEL':
					uri = body.host || ''; // File path or Google Sheets URL
					break;
				default:
					throw new Error('Unsupported database type');
			}
		}

		// Store metadata
		meta = JSON.stringify({
			host: body.host,
			port: body.port,
			database: body.database,
			username: body.username
		});

		// TODO: Encrypt URI and metadata in production
		const conn = await prisma.connection.create({
			data: {
				tenantId: req.user.tenantId,
				kind: body.kind,
				displayName: body.name,
				encUri: uri, // Should be encrypted
				encMeta: meta, // Should be encrypted
				readOnly: body.readOnly
			}
		});

		// Auto-discover and whitelist sheets for EXCEL connections
		if (body.kind === 'EXCEL' && uri) {
			try {
				await sheetDiscoveryService.discoverAndWhitelistSheets(
					req.user.tenantId,
					conn.id,
					uri
				);
			} catch (error: any) {
				console.warn('Failed to auto-discover sheets:', error.message);
				// Don't fail connection creation if sheet discovery fails
			}
		}

		// Test the connection by attempting to get it
		try {
			const config = {
				id: conn.id,
				tenantId: req.user.tenantId,
				kind: body.kind,
				uri: uri,
				readOnly: body.readOnly
			};
			await connectionManager.getConnection(config);
			
			// Auto-discover and whitelist sheets for EXCEL connections after successful connection
			if (body.kind === 'EXCEL' && uri) {
				try {
					await sheetDiscoveryService.discoverAndWhitelistSheets(
						req.user.tenantId,
						conn.id,
						uri
					);
				} catch (error: any) {
					console.warn('Failed to auto-discover sheets:', error.message);
					// Don't fail connection creation if sheet discovery fails
				}
			}
			
			res.json({ ...conn, status: 'connected', error: null });
		} catch (error) {
			res.json({ 
				...conn, 
				status: 'error', 
				error: error instanceof Error ? error.message : 'Connection test failed' 
			});
		}
	} catch (e) { 
		next(e); 
	}
});

// Test connection
router.post("/:id/test", async (req: any, res, next) => {
	try {
		const connectionId = req.params.id;
		
		// Verify connection belongs to tenant
		const connection = await prisma.connection.findFirst({
			where: { 
				id: connectionId, 
				tenantId: req.user.tenantId 
			}
		});

		if (!connection) {
			return res.status(404).json({ error: 'Connection not found' });
		}

		// Test connection by attempting to get it
		try {
			const config = {
				id: connection.id,
				tenantId: req.user.tenantId,
				kind: connection.kind,
				uri: connection.encUri, // Should be decrypted in production
				readOnly: connection.readOnly
			};
			await connectionManager.getConnection(config);
			
			res.json({ 
				success: true,
				status: 'connected',
				message: 'Connection successful'
			});
		} catch (testError) {
			res.json({ 
				success: false,
				status: 'error',
				message: testError instanceof Error ? testError.message : 'Connection test failed'
			});
		}
	} catch (error) {
		res.json({ 
			success: false,
			status: 'error',
			message: error instanceof Error ? error.message : 'Connection test failed'
		});
	}
});

// Delete connection
router.delete("/:id", async (req: any, res, next) => {
	try {
		const connectionId = req.params.id;
		
		// Verify connection belongs to tenant
		const connection = await prisma.connection.findFirst({
			where: { 
				id: connectionId, 
				tenantId: req.user.tenantId 
			}
		});

		if (!connection) {
			return res.status(404).json({ error: 'Connection not found' });
		}

		// Release any active connections
		await connectionManager.releaseConnection(req.user.tenantId, connectionId);

		// Delete from database
		await prisma.connection.delete({
			where: { id: connectionId }
		});

		res.json({ success: true, message: 'Connection deleted successfully' });
	} catch (e) { 
		next(e); 
	}
});

export default router;


