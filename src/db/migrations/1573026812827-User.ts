import {MigrationInterface, QueryRunner} from "typeorm";

export class User1573026812827 implements MigrationInterface {
    name = 'User1573026812827'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "user" ("username" character varying NOT NULL, "nickname" character varying NOT NULL, "id" integer, "lastActive" TIMESTAMP, "picked" boolean NOT NULL DEFAULT false, "reserved" boolean NOT NULL DEFAULT false, "eligible" boolean NOT NULL DEFAULT true, "customName" character varying, CONSTRAINT "PK_78a916df40e02a9deb1c4b75edb" PRIMARY KEY ("username"))`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "user"`, undefined);
    }

}
