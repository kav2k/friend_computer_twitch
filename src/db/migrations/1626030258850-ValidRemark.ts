import {MigrationInterface, QueryRunner} from "typeorm";

export class ValidRemark1626030258850 implements MigrationInterface {
    name = 'ValidRemark1626030258850'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pool" ADD "validRemark" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pool" DROP COLUMN "validRemark"`);
    }

}
