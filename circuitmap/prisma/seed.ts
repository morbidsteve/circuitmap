import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@circuitmap.com' },
    update: {},
    create: {
      email: 'admin@circuitmap.com',
      password: adminPassword,
      fullName: 'Admin User',
      subscriptionTier: 'premium',
    },
  });

  console.log('Created admin user:', admin.email);

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@circuitmap.com' },
    update: {},
    create: {
      email: 'demo@circuitmap.com',
      password: hashedPassword,
      fullName: 'Demo User',
      subscriptionTier: 'pro',
    },
  });

  console.log('Created demo user:', user.email);

  // Create main panel
  const panel = await prisma.panel.create({
    data: {
      userId: user.id,
      name: 'Main Panel',
      address: '123 Main Street',
      brand: 'square_d',
      mainAmperage: 200,
      totalSlots: 34,
      columns: 2,
    },
  });

  console.log('Created panel:', panel.name);

  // Create breakers with their positions
  const breakersData = [
    { position: '1-3', amperage: 40, poles: 2, label: 'Range', circuitType: 'appliance', protectionType: 'standard', sortOrder: 1 },
    { position: '5-7', amperage: 30, poles: 2, label: 'Dryer', circuitType: 'appliance', protectionType: 'standard', sortOrder: 3 },
    { position: '2-4', amperage: 100, poles: 2, label: 'Subpanel', circuitType: 'other', protectionType: 'standard', sortOrder: 2 },
    { position: '9', amperage: 30, poles: 1, label: 'Water Heater', circuitType: 'appliance', protectionType: 'standard', sortOrder: 5 },
    { position: '12', amperage: 20, poles: 2, label: 'Furnace', circuitType: 'hvac', protectionType: 'standard', sortOrder: 6 },
    { position: '6', amperage: 20, poles: 1, label: 'Flower Room / Outdoor', circuitType: 'general', protectionType: 'standard', sortOrder: 4 },
    { position: '8', amperage: 20, poles: 1, label: '1st Floor Lights / Stairs', circuitType: 'lighting', protectionType: 'standard', sortOrder: 7 },
    { position: '10', amperage: 20, poles: 1, label: '2nd Floor Lights / Bedrooms', circuitType: 'lighting', protectionType: 'afci', sortOrder: 8 },
    { position: '13', amperage: 15, poles: 1, label: 'Living Room', circuitType: 'general', protectionType: 'afci', sortOrder: 9 },
    { position: '14', amperage: 20, poles: 1, label: 'Kitchen Outlets A', circuitType: 'general', protectionType: 'standard', sortOrder: 10 },
    { position: '15', amperage: 20, poles: 1, label: 'Laundry Room', circuitType: 'general', protectionType: 'standard', sortOrder: 11 },
    { position: '16', amperage: 20, poles: 1, label: 'Kitchen / Laundry B', circuitType: 'general', protectionType: 'afci', sortOrder: 12 },
    { position: '17', amperage: 20, poles: 1, label: 'Dining Room / Hallway', circuitType: 'general', protectionType: 'standard', sortOrder: 13 },
    { position: '18', amperage: 20, poles: 1, label: 'Office', circuitType: 'general', protectionType: 'afci', sortOrder: 14 },
    { position: '19', amperage: 20, poles: 1, label: 'Kitchen / Dining', circuitType: 'general', protectionType: 'standard', sortOrder: 15 },
    { position: '20', amperage: 20, poles: 1, label: 'Primary Bedroom', circuitType: 'general', protectionType: 'standard', sortOrder: 16 },
    { position: '22', amperage: 15, poles: 1, label: 'Closets / Misc', circuitType: 'general', protectionType: 'standard', sortOrder: 17 },
    { position: '23', amperage: 20, poles: 1, label: 'Den', circuitType: 'general', protectionType: 'standard', sortOrder: 18 },
    { position: '24', amperage: 20, poles: 1, label: '2nd Floor Bath A', circuitType: 'general', protectionType: 'gfci', sortOrder: 19 },
    { position: '25', amperage: 20, poles: 1, label: 'Guest Bedroom / Office', circuitType: 'general', protectionType: 'standard', sortOrder: 20 },
    { position: '26', amperage: 20, poles: 1, label: 'Dining Room Lights', circuitType: 'lighting', protectionType: 'standard', sortOrder: 21 },
    { position: '27', amperage: 20, poles: 1, label: 'Stairs / Landing', circuitType: 'general', protectionType: 'standard', sortOrder: 22 },
    { position: '30', amperage: 20, poles: 1, label: 'Dining Room Outlets', circuitType: 'general', protectionType: 'standard', sortOrder: 23 },
  ];

  const breakers = await Promise.all(
    breakersData.map((breaker) =>
      prisma.breaker.create({
        data: {
          ...breaker,
          panelId: panel.id,
        },
      })
    )
  );

  console.log(`Created ${breakers.length} breakers`);

  // Create a map of breaker position to breaker id for later reference
  const breakerMap = new Map(breakers.map(b => [b.position, b.id]));

  // Create floors
  const floor1 = await prisma.floor.create({
    data: {
      panelId: panel.id,
      name: '1st Floor',
      level: 1,
    },
  });

  const floor2 = await prisma.floor.create({
    data: {
      panelId: panel.id,
      name: '2nd Floor',
      level: 2,
    },
  });

  console.log('Created floors');

  // Create rooms for 1st floor
  const rooms1stFloor = [
    { name: 'Den', positionX: 0, positionY: 0, width: 150, height: 120 },
    { name: 'Laundry/Bathroom', positionX: 150, positionY: 0, width: 120, height: 100 },
    { name: 'Living Room', positionX: 0, positionY: 120, width: 120, height: 150 },
    { name: 'Kitchen', positionX: 120, positionY: 100, width: 140, height: 130 },
    { name: 'Dining Room', positionX: 260, positionY: 100, width: 140, height: 180 },
    { name: 'Flower Room', positionX: 120, positionY: 230, width: 100, height: 80 },
  ];

  const rooms1st = await Promise.all(
    rooms1stFloor.map((room) =>
      prisma.room.create({
        data: {
          ...room,
          floorId: floor1.id,
        },
      })
    )
  );

  // Create rooms for 2nd floor
  const rooms2ndFloor = [
    { name: 'Guest Bedroom', positionX: 0, positionY: 0, width: 150, height: 130 },
    { name: 'Office', positionX: 150, positionY: 0, width: 130, height: 130 },
    { name: 'Primary Bedroom', positionX: 0, positionY: 130, width: 130, height: 180 },
    { name: 'Bathroom', positionX: 130, positionY: 130, width: 100, height: 90 },
    { name: 'Primary Closet', positionX: 130, positionY: 220, width: 100, height: 90 },
    { name: 'Stairs/Landing', positionX: 230, positionY: 130, width: 70, height: 180 },
  ];

  const rooms2nd = await Promise.all(
    rooms2ndFloor.map((room) =>
      prisma.room.create({
        data: {
          ...room,
          floorId: floor2.id,
        },
      })
    )
  );

  console.log(`Created ${rooms1st.length + rooms2nd.length} rooms`);

  // Create a map of room names to room ids
  const allRooms = [...rooms1st, ...rooms2nd];
  const roomMap = new Map(allRooms.map(r => [r.name, r.id]));

  // Create devices
  const devicesData = [
    // 1st Floor
    { room: 'Den', type: 'outlet', breakerPosition: '23', description: 'Wall outlet', positionX: 30, positionY: 30 },
    { room: 'Laundry/Bathroom', type: 'outlet', breakerPosition: '15', description: 'Washer outlet', positionX: 170, positionY: 20 },
    { room: 'Laundry/Bathroom', type: 'outlet', breakerPosition: '16', description: 'Utility outlet', positionX: 200, positionY: 20 },
    { room: 'Living Room', type: 'outlet', breakerPosition: '10', description: 'TV wall outlet', positionX: 30, positionY: 150 },
    { room: 'Living Room', type: 'outlet', breakerPosition: '10', description: 'Sofa outlet', positionX: 80, positionY: 200 },
    { room: 'Living Room', type: 'outlet', breakerPosition: '8', description: 'Near stairs', positionX: 100, positionY: 250 },
    { room: 'Kitchen', type: 'outlet', breakerPosition: '14', description: 'Counter left', positionX: 130, positionY: 120 },
    { room: 'Kitchen', type: 'outlet', breakerPosition: '14', description: 'Counter right', positionX: 240, positionY: 120 },
    { room: 'Kitchen', type: 'outlet', breakerPosition: '16', description: 'Counter back', positionX: 185, positionY: 110 },
    { room: 'Kitchen', type: 'fixture', breakerPosition: '14', description: 'Under cabinet lights', positionX: 185, positionY: 115 },
    { room: 'Kitchen', type: 'fixture', breakerPosition: '8', description: 'Ceiling light', positionX: 190, positionY: 165 },
    { room: 'Kitchen', type: 'outlet', breakerPosition: '19', description: 'Island outlet', positionX: 190, positionY: 180 },
    { room: 'Dining Room', type: 'outlet', breakerPosition: '19', description: 'Buffet outlet', positionX: 270, positionY: 120 },
    { room: 'Dining Room', type: 'outlet', breakerPosition: '26', description: 'Corner outlet', positionX: 380, positionY: 120 },
    { room: 'Dining Room', type: 'fixture', breakerPosition: '26', description: 'Chandelier', positionX: 330, positionY: 190 },
    { room: 'Dining Room', type: 'outlet', breakerPosition: '30', description: 'Window outlet 1', positionX: 270, positionY: 200 },
    { room: 'Dining Room', type: 'outlet', breakerPosition: '30', description: 'Window outlet 2', positionX: 300, positionY: 200 },
    { room: 'Dining Room', type: 'outlet', breakerPosition: '30', description: 'Back wall outlet', positionX: 330, positionY: 260 },
    { room: 'Dining Room', type: 'outlet', breakerPosition: '30', description: 'Exterior door outlet', positionX: 380, positionY: 260 },
    { room: 'Flower Room', type: 'fixture', breakerPosition: '8', description: 'Ceiling light', positionX: 170, positionY: 270 },
    { room: 'Flower Room', type: 'outlet', breakerPosition: '6', description: 'Wall outlet', positionX: 150, positionY: 280 },

    // 2nd Floor
    { room: 'Guest Bedroom', type: 'fixture', breakerPosition: '10', description: 'Ceiling light', positionX: 75, positionY: 65 },
    { room: 'Guest Bedroom', type: 'outlet', breakerPosition: '25', description: 'Bed left', positionX: 30, positionY: 80 },
    { room: 'Guest Bedroom', type: 'outlet', breakerPosition: '25', description: 'Bed right', positionX: 120, positionY: 80 },
    { room: 'Guest Bedroom', type: 'outlet', breakerPosition: '25', description: 'Desk wall', positionX: 140, positionY: 30 },
    { room: 'Office', type: 'fixture', breakerPosition: '10', description: 'Ceiling light', positionX: 215, positionY: 65 },
    { room: 'Office', type: 'outlet', breakerPosition: '25', description: 'North wall 1', positionX: 170, positionY: 20 },
    { room: 'Office', type: 'outlet', breakerPosition: '25', description: 'North wall 2', positionX: 220, positionY: 20 },
    { room: 'Office', type: 'outlet', breakerPosition: '25', description: 'West wall', positionX: 160, positionY: 80 },
    { room: 'Office', type: 'outlet', breakerPosition: '18', description: 'Desk outlet', positionX: 240, positionY: 80 },
    { room: 'Primary Bedroom', type: 'fixture', breakerPosition: '10', description: 'Ceiling fan/light', positionX: 65, positionY: 220 },
    { room: 'Primary Bedroom', type: 'outlet', breakerPosition: '20', description: 'Bed left', positionX: 20, positionY: 200 },
    { room: 'Primary Bedroom', type: 'outlet', breakerPosition: '20', description: 'Bed right', positionX: 110, positionY: 200 },
    { room: 'Primary Bedroom', type: 'outlet', breakerPosition: '20', description: 'Dresser wall', positionX: 20, positionY: 280 },
    { room: 'Primary Bedroom', type: 'outlet', breakerPosition: '20', description: 'Window wall 1', positionX: 60, positionY: 300 },
    { room: 'Primary Bedroom', type: 'outlet', breakerPosition: '20', description: 'Window wall 2', positionX: 100, positionY: 300 },
    { room: 'Primary Bedroom', type: 'outlet', breakerPosition: '20', description: 'Closet door wall', positionX: 120, positionY: 280 },
    { room: 'Primary Bedroom', type: 'outlet', breakerPosition: '10', description: 'TV outlet', positionX: 120, positionY: 180 },
    { room: 'Bathroom', type: 'fixture', breakerPosition: '10', description: 'Vanity light', positionX: 180, positionY: 175 },
    { room: 'Bathroom', type: 'outlet', breakerPosition: '24', description: 'Vanity left', isGfciProtected: true, positionX: 150, positionY: 160 },
    { room: 'Bathroom', type: 'outlet', breakerPosition: '24', description: 'Vanity right', isGfciProtected: true, positionX: 210, positionY: 160 },
    { room: 'Bathroom', type: 'outlet', breakerPosition: '24', description: 'Toilet wall', positionX: 160, positionY: 200 },
    { room: 'Primary Closet', type: 'fixture', breakerPosition: '10', description: 'Closet light', positionX: 180, positionY: 265 },
    { room: 'Primary Closet', type: 'outlet', breakerPosition: '22', description: 'Closet outlet', positionX: 200, positionY: 280 },
    { room: 'Stairs/Landing', type: 'fixture', breakerPosition: '8', description: 'Stairway light', positionX: 265, positionY: 220 },
    { room: 'Stairs/Landing', type: 'fixture', breakerPosition: '27', description: 'Landing light', positionX: 265, positionY: 180 },
    { room: 'Stairs/Landing', type: 'outlet', breakerPosition: '27', description: 'Landing outlet', positionX: 280, positionY: 200 },
    { room: 'Stairs/Landing', type: 'outlet', breakerPosition: '23', description: 'Top of stairs outlet', positionX: 250, positionY: 150 },
  ];

  const devices = await Promise.all(
    devicesData.map((device) => {
      const roomId = roomMap.get(device.room);
      const breakerId = breakerMap.get(device.breakerPosition);

      if (!roomId) {
        console.warn(`Room not found: ${device.room}`);
        return null;
      }

      return prisma.device.create({
        data: {
          roomId,
          breakerId,
          type: device.type,
          description: device.description,
          positionX: device.positionX,
          positionY: device.positionY,
          isGfciProtected: device.isGfciProtected || false,
        },
      });
    })
  );

  const createdDevices = devices.filter(d => d !== null);
  console.log(`Created ${createdDevices.length} devices`);

  console.log('\nSeed completed successfully!');
  console.log('\nAdmin credentials:');
  console.log('Email: admin@circuitmap.com');
  console.log('Password: admin123');
  console.log('\nDemo credentials:');
  console.log('Email: demo@circuitmap.com');
  console.log('Password: demo123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
