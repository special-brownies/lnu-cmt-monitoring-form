import { Injectable } from '@nestjs/common'
import { EquipmentService } from '../equipment/equipment.service'

@Injectable()
export class DashboardService {
  constructor(private readonly equipmentService: EquipmentService) {}

  async getStats() {
    const summary = await this.equipmentService.findSummary()

    return {
      totalEquipment: summary.totalEquipment,
      activeEquipment: summary.activeEquipment,
      maintenanceCount: summary.maintenanceCount,
    }
  }
}
