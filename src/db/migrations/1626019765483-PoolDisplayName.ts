import {MigrationInterface, QueryRunner} from "typeorm";

export class PoolDisplayName1626019765483 implements MigrationInterface {
    name = 'PoolDisplayName1626019765483'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pool" ADD "displayName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pool" DROP COLUMN "displayName"`);
    }

}
