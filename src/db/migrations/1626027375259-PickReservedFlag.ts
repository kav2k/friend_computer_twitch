import {MigrationInterface, QueryRunner} from "typeorm";

export class PickReservedFlag1626027375259 implements MigrationInterface {
    name = 'PickReservedFlag1626027375259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pick" ADD "reserved" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pick" DROP COLUMN "reserved"`);
    }

}
