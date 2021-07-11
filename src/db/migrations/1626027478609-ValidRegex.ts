import {MigrationInterface, QueryRunner} from "typeorm";

export class ValidRegex1626027478609 implements MigrationInterface {
    name = 'ValidRegex1626027478609'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pool" ADD "validRegex" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pool" DROP COLUMN "validRegex"`);
    }

}
