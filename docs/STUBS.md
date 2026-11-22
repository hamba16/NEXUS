# Integration Stubs

| Stub | Real system | Current implementation | Swap-in requirement |
|---|---|---|---|
| OpenAuthProvider | NIRA/SSO/OIDC | Resolves seeded open-mode profiles | JWT/OIDC claims map into `Actor` |
| NotificationGateway | SMS/email/WhatsApp | Not implemented | Add outbox-backed gateway |
| PBSAdapter | Programme Budgeting System | Not implemented | Interface and fixture contract |
| IBPAdapter | Integrated Bank of Projects | Not implemented | Interface and fixture contract |
| IFMISAdapter | IFMIS financial data | Not implemented | Interface and fixture contract |
| NDRImportAdapter | NPA NDR imports | Local PDF URLs and verifier only | Signed/imported snapshot ingest |
| ReferralGateway | IGG/Auditor General | Not implemented | External handoff adapter |
| GeoBoundaryProvider | geoBoundaries | Not implemented | Licensed GeoJSON and attribution |
| BlobStore | MinIO/S3 | Compose service only | Pre-signed upload/download implementation |

No stub presents a live external integration as operational.
